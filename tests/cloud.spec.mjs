import { test, expect } from "@playwright/test";
import { freshProgress } from "../src/lib/progress.ts";
const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
async function recoveryOptions(page) {
  const summary = page.getByText("Cloud recovery & save options", {
    exact: true,
  });
  if ((await summary.locator("..").getAttribute("open")) === null)
    await summary.click();
}
async function mockCloud(page, participants = []) {
  const snapshots = new Map(),
    history = new Map();
  let actor;
  const profiles = new Map(),
    board = new Map(participants.map((p) => [p.user_id, p]));
  const user = (id) => ({
    id,
    email: id === A ? "a@example.com" : "b@example.com",
    aud: "authenticated",
    role: "authenticated",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: profiles.get(id) || {},
    created_at: new Date().toISOString(),
  });
  const token = (id) =>
    `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600, role: "authenticated", aud: "authenticated" })).toString("base64url")}.fake`;
  await page.route("**/auth/v1/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      body = request.postDataJSON();
    let result = {},
      status = 200;
    if (url.pathname.endsWith("/token")) {
      if (body.password === "wrongpass") {
        status = 400;
        result = {
          code: "invalid_credentials",
          msg: "Invalid login credentials",
        };
      } else {
        actor = body.email?.startsWith("b") ? B : A;
        result = {
          access_token: token(actor),
          refresh_token: "mock-refresh",
          token_type: "bearer",
          expires_in: 3600,
          user: user(actor),
        };
      }
    } else if (url.pathname.endsWith("/user")) {
      if (request.method() === "PUT")
        profiles.set(actor, { ...profiles.get(actor), ...body.data });
      result = user(actor);
    } else if (url.pathname.endsWith("/signup"))
      result = { user: user(A), session: null };
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(result),
    });
  });
  await page.route("**/rest/v1/**", async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname;
    let result = [];
    let responseHeaders = {};
    if (path.endsWith("/cq_rankings")) {
      const url = new URL(request.url());
      const ranked = [...board.values()]
        .filter((r) => r.visible)
        .sort(
          (a, b) =>
            b.xp - a.xp ||
            b.completed - a.completed ||
            a.user_id.localeCompare(b.user_id),
        )
        .map((r, i, all) => ({
          ...r,
          position: i + 1,
          rank:
            all.findIndex((x) => x.xp === r.xp && x.completed === r.completed) +
            1,
          xp_ahead: i ? all[i - 1].xp : null,
        }));
      const own = url.searchParams.get("user_id");
      const filtered = own
        ? ranked.filter((r) => r.user_id === own.slice(3))
        : ranked;
      const start = Number(url.searchParams.get("offset") || 0),
        limit = Number(url.searchParams.get("limit") || 25);
      result = filtered.slice(start, start + limit);
      responseHeaders = {
        "access-control-expose-headers": "content-range",
        "content-range": `${start}-${start + result.length - 1}/${filtered.length}`,
      };
    } else if (path.endsWith("/cq_leaderboard")) {
      if (request.method() === "POST") {
        board.set(actor, request.postDataJSON());
        result = null;
      } else if (request.method() === "DELETE") {
        board.delete(actor);
        result = null;
      } else {
        const url = new URL(request.url());
        result = [...board.values()]
          .filter((r) =>
            url.searchParams.has("user_id") ? r.user_id === actor : r.visible,
          )
          .sort((a, b) => b.xp - a.xp);
      }
    } else if (path.endsWith("/cq_save_snapshot")) {
      const body = request.postDataJSON();
      if (body.expected_revision !== (snapshots.get(actor)?.revision || 0)) {
        await route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Cloud save changed on another device",
          }),
        });
        return;
      }
      snapshots.set(actor, {
        snapshot: body.payload,
        revision: body.expected_revision + 1,
      });
      history.set(actor, [
        {
          id: "save-1",
          summary: body.summary,
          created_at: new Date().toISOString(),
        },
      ]);
      result = null;
    } else if (path.endsWith("/cq_snapshots"))
      result = snapshots.has(actor) ? [snapshots.get(actor)] : [];
    else if (path.endsWith("/cq_history")) result = history.get(actor) || [];
    await route.fulfill({
      status: 200,
      headers: responseHeaders,
      contentType: "application/json",
      body: JSON.stringify(result),
    });
  });
  return { snapshots, history };
}

test("rankings include more than fifty students and Find my rank locates a student on page three", async ({
  page,
}) => {
  const roster = Array.from({ length: 105 }, (_, i) => ({
    user_id:
      i === 66 ? A : "90000000-0000-4000-8000-" + String(i).padStart(12, "0"),
    nickname: "Builder " + i,
    avatar: "🤖",
    xp: 1000 - i * 5,
    completed: 0,
    visible: true,
  }));
  await mockCloud(page, roster);
  await page.goto("/#account");
  await signin(page);
  await page.goto("/#leaderboard");
  await expect(page.getByText("Your rank: #67", { exact: true })).toBeVisible();
  await expect(page.getByText(/105 players/).first()).toBeVisible();
  await page.getByRole("button", { name: "Find my rank" }).click();
  await expect(page.locator(".leaderboard-list")).toContainText(
    "Builder 66 · You",
  );
  await expect(page.locator(".rank-pagination")).toContainText("Page 3 of 5");
  await page.getByRole("button", { name: "Next players" }).click();
  await page.getByRole("button", { name: "Next players" }).click();
  await expect(page.locator(".leaderboard-list li")).toHaveCount(5);
  await expect(page.locator(".leaderboard-list")).toContainText("Builder 104");
});

async function signin(page, email = "a@example.com", password = "password123") {
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
test("signed-in learner saves account nickname and avatar, explicitly joins rankings, and can leave", async ({
  page,
}) => {
  await mockCloud(page);
  await page.goto("/#account");
  await signin(page);
  await expect(
    page.getByRole("heading", { name: "a@example.com" }),
  ).toBeVisible();
  await page.getByLabel("Your name", { exact: true }).fill("Student");
  await page.getByLabel("Nickname", { exact: true }).fill("BankBoss");
  await page.getByRole("button", { name: "Choose avatar 🦁" }).click();
  await page.getByRole("button", { name: "Save player profile" }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Profile saved to your account" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Nickname", { exact: true })).toHaveValue(
    "BankBoss",
  );
  await page.goto("/#leaderboard");
  await expect(
    page.getByRole("button", { name: "Join leaderboard" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Join leaderboard" }).click();
  await expect(page.locator(".leaderboard-list")).toContainText(
    "BankBoss · You",
  );
  await expect(page.locator(".leaderboard-list")).not.toContainText(
    "a@example.com",
  );
  await page.getByRole("button", { name: "Leave leaderboard" }).click();
  await expect(page.locator(".leaderboard-list")).toHaveCount(0);
  await page.goto("/#account");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await signin(page, "b@example.com");
  await expect(page.getByLabel("Nickname", { exact: true })).toHaveValue("");
});
test("sign in errors, account-isolated local drafts, cloud save and explicit restore", async ({
  page,
}) => {
  const cloud = await mockCloud(page);
  await page.addInitScript(
    (state) => localStorage.setItem("cq-progress-v1", JSON.stringify(state)),
    {
      ...freshProgress(),
      settings: { ...freshProgress().settings, name: "Guest learner" },
    },
  );
  await page.goto("/#account");
  await signin(page, "a@example.com", "wrongpass");
  await expect(page.getByRole("status")).toContainText(
    "Email or password is incorrect.",
  );
  await signin(page);
  await expect(
    page.getByRole("heading", { name: "a@example.com" }),
  ).toBeVisible();
  await page.goto("/#settings");
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue("");
  await page.getByLabel("Your name", { exact: true }).fill("Account A");
  await page.goto("/#account");
  await recoveryOptions(page);
  await page
    .getByRole("button", { name: "Save to cloud", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Saved to your account");
  expect(cloud.snapshots.get(A).snapshot.progress.settings.name).toBe(
    "Account A",
  );
  await page.goto("/#settings");
  await page.getByLabel("Your name", { exact: true }).fill("Changed locally");
  await page.goto("/#account");
  await recoveryOptions(page);
  await page
    .getByRole("button", { name: "Restore cloud save", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Replace local work with cloud save" })
    .click();
  await expect(page.getByRole("status")).toContainText("Cloud save restored");
  await page.goto("/#settings");
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue(
    "Account A",
  );
  await page.goto("/#account");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await signin(page, "b@example.com");
  await page.goto("/#settings");
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue("");
  await page.goto("/#account");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.goto("/#settings");
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue(
    "Guest learner",
  );
});
test("signup and password-reset forms give confirmation guidance", async ({
  page,
}) => {
  await mockCloud(page);
  await page.goto("/#account");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByLabel("Email", { exact: true }).fill("a@example.com");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Check your inbox");
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await page.getByLabel("Email", { exact: true }).fill("a@example.com");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText("reset link");
});
test("ElevenLabs unavailable and quota messages leave device controls available", async ({
  page,
}) => {
  await mockCloud(page);
  await page.route("**/api/voice", (route) =>
    route.fulfill({
      status: 429,
      contentType: "application/json",
      body: JSON.stringify({
        error:
          "The cloud voice allowance has been reached. Device voices are still available.",
      }),
    }),
  );
  await page.goto("/#account");
  await signin(page);
  await page.goto("/#settings");
  await page
    .getByLabel("Read-aloud service", { exact: true })
    .selectOption("elevenlabs");
  await page.getByRole("button", { name: "Read aloud", exact: true }).click();
  await expect(page.getByRole("status").first()).toContainText(
    "allowance has been reached",
  );
  await page
    .getByLabel("Voice input language", { exact: true })
    .selectOption("zu-ZA");
  await page.getByRole("button", { name: "Read aloud", exact: true }).click();
  await expect(page.getByRole("status").first()).toContainText(
    "No verified ElevenLabs voice",
  );
  await page
    .getByLabel("Read-aloud service", { exact: true })
    .selectOption("device");
  await expect(page.getByLabel("Device voice", { exact: true })).toBeVisible();
});

test("lecturer creates a class, assigns a quest and sees shared progress", async ({
  page,
}) => {
  await mockCloud(page);
  const classroom = {
    id: "class-1",
    name: "Evening C#",
    owner_id: A,
    join_code: "44444444-4444-4444-8444-444444444444",
  };
  let created = false,
    assignments = [];
  await page.route("**/rest/v1/cq_classes*", async (route) => {
    if (route.request().method() === "POST") {
      created = true;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(classroom),
      });
    } else
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(created ? [classroom] : []),
      });
  });
  await page.route("**/rest/v1/cq_assignments*", async (route) => {
    if (route.request().method() === "POST") {
      assignments.push({
        id: "assignment-1",
        ...route.request().postDataJSON(),
      });
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: "null",
      });
    } else if (route.request().method() === "DELETE") {
      assignments = [];
      await route.fulfill({ status: 204, body: "" });
    } else
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(assignments),
      });
  });
  await page.route("**/rest/v1/cq_members*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          user_id: B,
          display_name: "Learner B",
          completed: ["variables"],
          xp: 100,
          updated_at: new Date().toISOString(),
        },
      ]),
    }),
  );
  await page.goto("/#account");
  await signin(page);
  await page.goto("/#classes");
  await page.getByLabel("Class name", { exact: true }).fill("Evening C#");
  await page.getByRole("button", { name: "Create class", exact: true }).click();
  await expect(
    page.getByText(classroom.join_code, { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Assign quest", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Shared learning progress" }),
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: "Learner B" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Remove assignment" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Remove assignment" }).click();
  await expect(page.getByText("No quests assigned yet.")).toBeVisible();
  await page
    .getByRole("combobox", { name: "Quest", exact: true })
    .selectOption("repair:equipment-booking");
  await page.getByRole("button", { name: "Assign quest", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Repair · Practice Question 15 OCT: Equipment Booking",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/#challenges\/equipment-booking$/);
  await expect(
    page.getByRole("heading", {
      name: "Practice Question 15 OCT: Equipment Booking",
      exact: true,
    }),
  ).toBeVisible();
});

test("learner joins by invitation, explicitly shares progress and leaves the class", async ({
  page,
}) => {
  await mockCloud(page);
  const classroom = {
    id: "class-2",
    name: "Morning C#",
    owner_id: B,
    join_code: "55555555-5555-4555-8555-555555555555",
  };
  let joined = false,
    shared = false;
  await page.route("**/rest/v1/rpc/cq_join_class", async (route) => {
    joined = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(classroom.id),
    });
  });
  await page.route("**/rest/v1/cq_classes*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(joined ? [classroom] : []),
    }),
  );
  await page.route("**/rest/v1/cq_members*", async (route) => {
    if (route.request().method() === "PATCH") shared = true;
    if (route.request().method() === "DELETE") joined = false;
    await route.fulfill({
      status: route.request().method() === "GET" ? 200 : 204,
      contentType: "application/json",
      body: route.request().method() === "GET" ? "[]" : "",
    });
  });
  await page.goto("/#account");
  await signin(page);
  await page.goto("/#classes");
  await page
    .getByLabel("Invitation code", { exact: true })
    .fill(classroom.join_code);
  await page.getByRole("button", { name: "Join class", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Share my progress", exact: true }),
  ).toBeVisible();
  expect(shared).toBe(false);
  await page
    .getByRole("button", { name: "Share my progress", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("progress was shared");
  expect(shared).toBe(true);
  await page.getByRole("button", { name: "Leave class", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Left the class");
  expect(joined).toBe(false);
});

test("unreachable expired-session refresh does not block guest learning", async ({
  page,
}) => {
  const expired = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: A, exp: 1, role: "authenticated", aud: "authenticated" })).toString("base64url")}.fake`;
  await page.addInitScript(
    ({ expired, A }) =>
      localStorage.setItem(
        "sb-mock-codequest-auth-token",
        JSON.stringify({
          access_token: expired,
          refresh_token: "expired-refresh",
          expires_at: 1,
          expires_in: 1,
          token_type: "bearer",
          user: {
            id: A,
            email: "a@example.com",
            aud: "authenticated",
            app_metadata: {},
            user_metadata: {},
            created_at: new Date().toISOString(),
          },
        }),
      ),
    { expired, A },
  );
  await page.route("**/auth/v1/token*", () => {});
  await page.goto("/#account");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible(
    { timeout: 12000 },
  );
  await expect(page.getByRole("status")).toContainText("connection timed out");
  await page.goto("/#learn");
  await expect(page.locator(".page h1")).toBeVisible({ timeout: 12000 });
});

test("password recovery callback updates the password and returns to the account", async ({
  page,
}) => {
  await mockCloud(page);
  await page.addInitScript(() =>
    localStorage.setItem(
      "sb-mock-codequest-auth-token-code-verifier",
      JSON.stringify("fixture/recovery"),
    ),
  );
  await page.goto("/?code=test-code&auth=recovery#account");
  await expect(
    page.getByRole("heading", { name: "Choose a new password" }),
  ).toBeVisible();
  await page.getByLabel("Password", { exact: true }).fill("newpassword123");
  await page
    .getByRole("button", { name: "Update password", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Sign out", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Password updated");
});

test("sign-in normalises email and accepts an existing shorter password; password visibility is explicit", async ({
  page,
}) => {
  await mockCloud(page);
  let credentials;
  page.on("request", (request) => {
    if (request.url().includes("/auth/v1/token"))
      credentials = request.postDataJSON();
  });
  await page.goto("/#account");
  await page.getByLabel("Email", { exact: true }).fill("A@EXAMPLE.COM");
  await page.getByLabel("Password", { exact: true }).fill("older7");
  await page
    .getByRole("button", { name: "Show password", exact: true })
    .click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page
    .getByRole("button", { name: "Hide password", exact: true })
    .click();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Sign out", exact: true }),
  ).toBeVisible();
  expect(credentials).toMatchObject({
    email: "a@example.com",
    password: "older7",
  });
});
test("duplicate signup never promises a new account or overwrites the original password", async ({
  page,
}) => {
  await mockCloud(page);
  await page.route("**/auth/v1/signup*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: { id: A, identities: [] }, session: null }),
    }),
  );
  await page.goto("/#account");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByLabel("Email", { exact: true }).fill("a@example.com");
  await page.getByLabel("Password", { exact: true }).fill("newpassword123");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("original password");
  await expect(
    page.getByRole("heading", { name: "Welcome back", exact: true }),
  ).toBeVisible();
});
test("registered-address signup explains that the original password is unchanged", async ({
  page,
}) => {
  await mockCloud(page);
  await page.route("**/auth/v1/signup*", (route) =>
    route.fulfill({
      status: 422,
      contentType: "application/json",
      body: JSON.stringify({
        code: "user_already_exists",
        msg: "User already registered",
      }),
    }),
  );
  await page.goto("/#account");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByLabel("Email", { exact: true }).fill("a@example.com");
  await page.getByLabel("Password", { exact: true }).fill("newpassword123");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "does not change its password",
  );
  await expect(
    page.getByRole("heading", { name: "Welcome back", exact: true }),
  ).toBeVisible();
});

test("automatic backup persists edits and pauses on a cross-device conflict", async ({
  page,
}) => {
  const cloud = await mockCloud(page);
  await page.clock.install();
  await page.goto("/#account");
  await signin(page);
  await expect.poll(() => cloud.snapshots.get(A)?.revision).toBe(1);
  await page.goto("/#settings");
  await page
    .getByLabel("Your name", { exact: true })
    .fill("Auto saved learner");
  await page.clock.fastForward(61000);
  await expect(page.locator(".cloud-backup-status")).toHaveCount(0);
  expect(cloud.snapshots.get(A).snapshot.progress.settings.name).toBe(
    "Auto saved learner",
  );
  await page.route("**/rest/v1/rpc/cq_save_snapshot", (route) =>
    route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({ message: "Cloud save changed on another device" }),
    }),
  );
  await page
    .getByLabel("Your name", { exact: true })
    .fill("Preserve this local draft");
  await page.clock.fastForward(61000);
  await expect(page.locator(".cloud-backup-status")).toContainText(
    "Cloud backup paused",
  );
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue(
    "Preserve this local draft",
  );
});

test("manual save remains usable after automatic backup while Account stays open", async ({
  page,
}) => {
  const cloud = await mockCloud(page);
  await page.clock.install();
  await page.goto("/#account");
  await signin(page);
  await expect.poll(() => cloud.snapshots.get(A)?.revision).toBe(1);
  await page.clock.fastForward(61000);
  await expect(page.locator(".cloud-backup-status")).toHaveCount(0);
  const previous = cloud.snapshots.get(A).revision;
  await recoveryOptions(page);
  await page
    .getByRole("button", { name: "Save to cloud", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Saved to your account");
  expect(cloud.snapshots.get(A).revision).toBe(previous + 1);
});

test("lecturer switching classes cannot see an earlier delayed response overwrite the chosen class", async ({
  page,
}) => {
  await mockCloud(page);
  const classrooms = [
    { id: "slow-class", name: "Morning group", owner_id: A, join_code: "slow" },
    {
      id: "fast-class",
      name: "Afternoon group",
      owner_id: A,
      join_code: "fast",
    },
  ];
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/rest/v1/cq_classes*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(classrooms),
    }),
  );
  await page.route("**/rest/v1/cq_assignments*", async (route) => {
    const slow = route.request().url().includes("slow-class");
    if (slow) await gate;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: slow ? "slow-assignment" : "fast-assignment",
          lesson_id: slow ? "variables" : "repair:equipment-booking",
          due_date: null,
        },
      ]),
    });
  });
  await page.route("**/rest/v1/cq_members*", async (route) => {
    const slow = route.request().url().includes("slow-class");
    if (slow) await gate;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          user_id: B,
          display_name: slow ? "Wrong delayed group" : "Chosen group learner",
          completed: [],
          xp: 0,
          updated_at: new Date().toISOString(),
        },
      ]),
    });
  });
  await page.goto("/#account");
  await signin(page);
  await page.goto("/#classes");
  const pending = page.waitForRequest(
    (r) => r.url().includes("cq_assignments") && r.url().includes("slow-class"),
  );
  await page
    .getByRole("combobox", { name: "Your classes", exact: true })
    .selectOption("slow-class");
  await pending;
  await page
    .getByRole("combobox", { name: "Your classes", exact: true })
    .selectOption("fast-class");
  await expect(
    page.getByRole("cell", { name: "Chosen group learner" }),
  ).toBeVisible();
  const oldResponse = page.waitForResponse(
    (r) => r.url().includes("cq_members") && r.url().includes("slow-class"),
  );
  release();
  await oldResponse;
  await expect(
    page.getByRole("cell", { name: "Chosen group learner" }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Wrong delayed group" }),
  ).toHaveCount(0);
});

test("a new device restores its cloud draft automatically and unsaved local edits survive reload", async ({
  page,
}) => {
  const cloud = await mockCloud(page);
  await page.clock.install();
  await page.goto("/#account");
  await signin(page);
  await expect.poll(() => cloud.snapshots.get(A)?.revision).toBe(1);
  await page.goto("/#challenges/console");
  await page
    .getByRole("textbox", { name: "Beginner C# code" })
    .fill('using System; Console.WriteLine("saved on device one");');
  await page.evaluate((id) => {
    localStorage.setItem(
      "cq-source-files:" + id,
      JSON.stringify([{ path: "Student.cs", text: "class Student {}" }]),
    );
    localStorage.setItem("cq-terminal-language:" + id, "csharp");
    localStorage.setItem(
      "cq-terminal-source-csharp:" + id,
      'using System; Console.WriteLine("terminal draft");',
    );
  }, A);
  await page.clock.fastForward(6000);
  await expect
    .poll(
      () =>
        cloud.snapshots.get(A)?.snapshot.progress.drafts[
          "console-challenge-hello"
        ],
    )
    .toContain("device one");
  // Simulate the account opening on a fresh device, keeping only its auth session.
  await page.goto("/#terminal");
  await expect(page.getByLabel("Terminal code editor")).toBeVisible();
  await page.evaluate((id) => {
    for (const key of Object.keys(localStorage))
      if (key.endsWith(":" + id)) localStorage.removeItem(key);
  }, A);
  await page.reload();
  await expect(page.getByLabel("Terminal code editor")).toHaveValue(
    'using System; Console.WriteLine("terminal draft");',
  );
  await expect
    .poll(() =>
      page.evaluate(
        (id) => localStorage.getItem("cq-terminal-source-csharp:" + id),
        A,
      ),
    )
    .toContain("terminal draft");
  await expect
    .poll(() =>
      page.evaluate((id) => localStorage.getItem("cq-source-files:" + id), A),
    )
    .toContain("Student.cs");
  await page.goto("/#challenges/console");
  await expect(
    page.getByRole("textbox", { name: "Beginner C# code" }),
  ).toHaveText('using System; Console.WriteLine("saved on device one");');
  await page
    .getByRole("textbox", { name: "Beginner C# code" })
    .fill('using System; Console.WriteLine("new offline draft");');
  await page.reload();
  await page.clock.fastForward(6000);
  await expect
    .poll(
      () =>
        cloud.snapshots.get(A)?.snapshot.progress.drafts[
          "console-challenge-hello"
        ],
    )
    .toContain("offline draft");
});


test("Tor AI remembers follow-ups, preserves failed questions, and quiet saving stays out of the workspace",async({page})=>{
 const cloud=await mockCloud(page);
 const requests=[];
 let finishHold;const hold=new Promise(resolve=>{finishHold=resolve;});
 await page.route("**/api/tor",async route=>{
  const body=route.request().postDataJSON();requests.push(body);
  const question=body.messages.at(-1).content;
  if(question==='hold reply'){await hold;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({text:'Late reply must not appear'})}).catch(()=>{});}
  if(question==='fail now')return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Tor’s AI service is temporarily unavailable.'})});
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({text:question==='hey'?'Hey! What are we learning today?':'You said hey earlier. Here is a C# example: Console.WriteLine("Hello");',model:'test-model'})});
 });
 await page.goto('/#account');await signin(page);
 await expect.poll(()=>cloud.snapshots.get(A)?.revision).toBe(1);
 await expect(page.locator('.cloud-backup-status')).toHaveCount(0);
 await page.goto('/#tor');
 await page.getByLabel('Study question').fill('hey');await page.getByRole('button',{name:'Send to Tor',exact:true}).click();
 await expect(page.getByLabel('Study conversation')).toContainText('Hey! What are we learning today?');
 await page.getByLabel('Study question').fill('What did I say earlier?');await page.getByRole('button',{name:'Send to Tor',exact:true}).click();
 await expect(page.getByLabel('Study conversation')).toContainText('You said hey earlier');
 expect(requests[1].messages[0]).toEqual({role:'user',content:'hey'});
 expect(requests[1].messages[1].role).toBe('assistant');
 await page.reload();await expect(page.getByLabel('Study conversation')).toContainText('You said hey earlier');
 await page.getByLabel('Study question').fill('fail now');await page.getByRole('button',{name:'Send to Tor',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('temporarily unavailable');
 await expect(page.getByLabel('Study question')).toHaveValue('fail now');
 await expect(page.getByLabel('Study conversation')).not.toContainText('Read the first error');
 await page.getByLabel('Study question').fill('hold reply');await page.getByRole('button',{name:'Send to Tor',exact:true}).click();await page.getByRole('button',{name:'Stop reply',exact:true}).click();finishHold();await expect(page.getByLabel('Study question')).toHaveValue('hold reply');await expect(page.getByLabel('Study conversation')).not.toContainText('Late reply');
 await page.setViewportSize({width:360,height:800});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('signed-in student and lecturer resume the offline study guide and official sources',async({page,context})=>{
 await mockCloud(page);await page.goto('/#account');await signin(page);await page.goto('/#tor');
 await page.getByLabel('Tor mode',{exact:true}).selectOption('offline');
 await page.getByRole('button',{name:'What if bookings.txt is missing?',exact:true}).click();
 await expect(page.getByLabel('Study conversation')).toContainText('does not contain bookings.txt');
 await page.getByLabel('I’m here as').selectOption('lecturer');
 await page.getByRole('button',{name:'Create a repair assignment and suggested rubric',exact:true}).click();
 await expect(page.getByLabel('Study conversation')).toContainText('not an official UJ rubric');
 await expect(page.getByRole('link',{name:/^C# properties/})).toHaveAttribute('href',/learn.microsoft.com/);
 await page.getByRole('button',{name:'New practice question',exact:true}).click();await expect(page.getByRole('radio').first()).toBeVisible();
 await page.setViewportSize({width:360,height:800});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
 await page.evaluate(async()=>await navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 await context.setOffline(true);await page.reload();await expect(page.getByLabel('Study conversation')).toContainText('not an official UJ rubric');
 await page.getByLabel('Tor mode',{exact:true}).selectOption('offline');await page.getByLabel('Study question').fill('hey');await page.getByRole('button',{name:'Send to Tor',exact:true}).click();await expect(page.getByLabel('Study conversation')).toContainText('Hey');
 await context.setOffline(false);
});

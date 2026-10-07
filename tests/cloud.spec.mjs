import { test, expect } from "@playwright/test";
import { freshProgress } from "../src/lib/progress.ts";
const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
async function mockCloud(page) {
  const snapshots = new Map(),
    history = new Map();
  let actor;
  const user = (id) => ({
    id,
    email: id === A ? "a@example.com" : "b@example.com",
    aud: "authenticated",
    role: "authenticated",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
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
        actor = body.email.startsWith("a") ? A : B;
        result = {
          access_token: token(actor),
          refresh_token: "mock-refresh",
          token_type: "bearer",
          expires_in: 3600,
          user: user(actor),
        };
      }
    } else if (url.pathname.endsWith("/user")) result = user(actor);
    else if (url.pathname.endsWith("/signup"))
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
    if (path.endsWith("/cq_save_snapshot")) {
      const body = request.postDataJSON();
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
      contentType: "application/json",
      body: JSON.stringify(result),
    });
  });
  return { snapshots, history };
}
async function signin(page, email = "a@example.com", password = "password123") {
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
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
    "Invalid login credentials",
  );
  await signin(page);
  await expect(
    page.getByRole("heading", { name: "a@example.com" }),
  ).toBeVisible();
  await page.goto("/#settings");
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue("");
  await page.getByLabel("Your name", { exact: true }).fill("Account A");
  await page.goto("/#account");
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
  await expect(page.getByRole("status")).toContainText("Check your email");
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

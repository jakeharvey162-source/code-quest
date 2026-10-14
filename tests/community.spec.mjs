import { test, expect } from "@playwright/test";
import { fixture, A, B, C } from "./community-fixture.mjs";
async function signin(page, email) {
  await page.goto("/#account");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill("Community-test-123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Sign out", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name: "Classroom", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Classroom sections" })
    .getByRole("button", { name: "Community", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Community", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: /^C# workshop(?: \d+ unread messages)?$/,
    }),
  ).toBeVisible();
}
const channel = (page) =>
  page.getByRole("button", { name: /^C# workshop(?: \d+ unread messages)?$/ });
async function send(page, text) {
  await page
    .getByRole("textbox", { name: "Community message", exact: true })
    .fill(text);
  await expect(
    page.getByRole("status").filter({ hasText: "Draft saved on this device." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Conversation messages" }),
  ).toContainText(text);
}

test("two accounts exchange persistent public messages and code; consent gates DMs, blocking revokes them", async ({
  browser,
}) => {
  const service = await fixture();
  const ac = await browser.newContext(),
    bc = await browser.newContext(),
    cc = await browser.newContext();
  try {
    const a = await ac.newPage(),
      b = await bc.newPage(),
      c = await cc.newPage();
    for (const p of [a, b, c]) await service.attach(p);
    await signin(a, "a@community.test");
    await signin(b, "b@community.test");
    await signin(c, "c@community.test");
    await channel(a).click();
    await channel(b).click();
    await a
      .getByText("Attach code or a coding challenge", { exact: true })
      .click();
    await a
      .getByRole("textbox", { name: "Community code snippet", exact: true })
      .fill('Console.WriteLine("Shared code stays safe");');
    await send(a, "Can you help me understand this output?");
    await expect(
      b.getByRole("region", { name: "Conversation messages" }),
    ).toContainText("Can you help me understand this output?");
    await expect(b.getByLabel("csharp code snippet")).toContainText(
      "Shared code stays safe",
    );
    await b.getByRole("button", { name: "Save code", exact: true }).click();
    await b.getByRole("button", { name: "Code notebook", exact: true }).click();
    await expect(b.getByLabel("csharp code snippet")).toContainText(
      "Shared code stays safe",
    );
    await b
      .getByRole("button", { name: "Open in editor", exact: true })
      .click();
    await expect(
      b.getByRole("textbox", { name: "Terminal code editor", exact: true }),
    ).toHaveValue('Console.WriteLine("Shared code stays safe");');
    await expect(
      b.getByRole("button", { name: "Run terminal code", exact: true }),
    ).toBeEnabled();
    await expect(
      b.getByRole("log", { name: "Terminal console output" }),
    ).not.toContainText("› Shared code stays safe");
    await a
      .getByRole("button", { name: "People & friends", exact: true })
      .click();
    const bCard = a
      .locator(".community-person")
      .filter({ has: a.getByText("Bayo the builder", { exact: true }) });
    await bCard
      .getByRole("button", { name: "Add friend", exact: true })
      .click();
    await b.goto("/#community");
    await b.getByRole("button", { name: /People & friends/ }).click();
    await expect(
      b.getByRole("button", { name: "Accept request", exact: true }),
    ).toBeVisible();
    await b
      .getByRole("button", { name: "Accept request", exact: true })
      .click();
    await expect(
      b
        .locator(".community-person")
        .filter({ has: b.getByText("Ada the builder", { exact: true }) })
        .getByRole("button", { name: "Message", exact: true }),
    ).toBeVisible();
    await b
      .locator(".community-person")
      .filter({ has: b.getByText("Ada the builder", { exact: true }) })
      .getByRole("button", { name: "Message", exact: true })
      .click();
    await expect(
      b.getByRole("heading", { name: "Ada the builder", exact: true }),
    ).toBeVisible();
    await send(b, "Private: only our accepted friendship can read this.");
    await a.getByRole("button", { name: /Conversations/ }).click();
    await a.getByRole("button", { name: "Sync messages", exact: true }).click();
    await a
      .getByRole("button", {
        name: /^Bayo the builder(?: \d+ unread messages)?$/,
      })
      .click();
    await expect(
      a.getByRole("region", { name: "Conversation messages" }),
    ).toContainText("Private: only our accepted friendship can read this.");
    const dm = (
      await service.as(A, "select id from cq_community_rooms where kind='dm'")
    ).rows[0].id;
    expect(
      (
        await service.as(
          C,
          "select * from cq_community_messages where room_id=$1",
          [dm],
        )
      ).rows,
    ).toHaveLength(0);
    await a.getByRole("button", { name: "Block user", exact: true }).click();
    await expect(
      a.getByRole("button", {
        name: /^Bayo the builder(?: \d+ unread messages)?$/,
      }),
    ).toHaveCount(0);
    expect(
      (
        await service.as(
          B,
          "select * from cq_community_messages where room_id=$1",
          [dm],
        )
      ).rows,
    ).toHaveLength(0);
  } finally {
    await ac.close();
    await bc.close();
    await cc.close();
    await service.close();
  }
});

test("offline draft reload and queued delivery survive reconnect exactly once, without crossing accounts", async ({
  browser,
}) => {
  const service = await fixture();
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await service.attach(page);
    await signin(page, "a@community.test");
    await channel(page).click();
    await page
      .getByRole("textbox", { name: "Community message", exact: true })
      .fill("Draft survives a page refresh");
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Draft saved on this device." }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("textbox", { name: "Community message", exact: true }),
    ).toHaveValue("Draft survives a page refresh");
    await context.setOffline(true);
    await expect(
      page.getByText("○ Offline · drafts stay here", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Queue for reconnect", exact: true })
      .click();
    await expect(
      page.getByRole("region", { name: "Conversation messages" }),
    ).toContainText("Queued · not sent");
    expect(
      (
        await service.as(
          A,
          "select * from cq_community_messages where body='Draft survives a page refresh'",
        )
      ).rows,
    ).toHaveLength(0);
    await context.setOffline(false);
    await expect(
      page.getByRole("region", { name: "Conversation messages" }),
    ).not.toContainText("Queued · not sent");
    await page
      .getByRole("button", { name: "Sync messages", exact: true })
      .click();
    expect(
      (
        await service.as(
          A,
          "select * from cq_community_messages where body='Draft survives a page refresh'",
        )
      ).rows,
    ).toHaveLength(1);
    await page
      .getByRole("textbox", { name: "Community message", exact: true })
      .fill("Only account A can restore this");
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Draft saved on this device." }),
    ).toBeVisible();
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name: "Account", exact: true })
      .click();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await signin(page, "b@community.test");
    await channel(page).click();
    await expect(
      page.getByRole("textbox", { name: "Community message", exact: true }),
    ).toHaveValue("");
  } finally {
    await context.close();
    await service.close();
  }
});

for (const width of [320, 360, 412, 1440])
  test(`Community fits ${width}px with readable dark mode, persisted notebook and safe code transfer`, async ({
    browser,
  }) => {
    const service = await fixture();
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    });
    try {
      const page = await context.newPage();
      await service.attach(page);
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await signin(page, "a@community.test");
      await page
        .getByRole("button", { name: "Switch to dark mode", exact: true })
        .click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await page
        .getByRole("textbox", { name: "Community message", exact: true })
        .fill("<img src=x onerror=alert(1)> This must remain text.");
      await page
        .getByText("Attach code or a coding challenge", { exact: true })
        .click();
      await expect(
        page.getByRole("button", {
          name: "Attach code or a coding challenge",
          exact: true,
        }),
      ).toHaveAttribute("aria-expanded", "true");
      await page
        .getByRole("textbox", { name: "Community code snippet", exact: true })
        .fill('console.log("Notebook sample")');
      await page
        .getByRole("combobox", { name: "Code language", exact: true })
        .selectOption("javascript");
      await page
        .getByRole("button", { name: "Send message", exact: true })
        .click();
      await expect(
        page.getByRole("region", { name: "Conversation messages" }),
      ).toContainText("<img src=x onerror=alert(1)> This must remain text.");
      await expect(page.locator(".community-message img")).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 2,
        ),
      ).toBe(false);
      await page.screenshot({
        path: `test-results/community-${width}-conversation-dark.png`,
        fullPage: true,
      });
      await page
        .getByRole("button", { name: "Save code", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Code notebook", exact: true })
        .click();
      await expect(page.getByLabel("javascript code snippet")).toContainText(
        "Notebook sample",
      );
      await page
        .getByRole("button", { name: "Conversations", exact: true })
        .click();

      await page
        .getByRole("button", { name: "Code notebook", exact: true })
        .click();
      await expect(page.getByLabel("javascript code snippet")).toContainText(
        "Notebook sample",
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 2,
        ),
      ).toBe(false);
      if (width === 1440) {
        const downloaded = page.waitForEvent("download");
        await page
          .getByRole("button", { name: "Download snippet", exact: true })
          .click();
        expect((await downloaded).suggestedFilename()).toBe(
          "codequest-snippet.js",
        );
      }
      await page.screenshot({
        path: `test-results/community-${width}-dark.png`,
        fullPage: true,
      });
      await page
        .getByRole("button", { name: "Open in editor", exact: true })
        .click();
      await expect(
        page.getByRole("textbox", {
          name: "Terminal code editor",
          exact: true,
        }),
      ).toHaveValue('console.log("Notebook sample")');
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 2,
        ),
      ).toBe(false);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
      await service.close();
    }
  });

test("Classroom and legacy community links require sign-in; challenges stay available", async ({
  page,
}) => {
  for (const path of ["classes", "community"]) {
    await page.goto("/#" + path);
    await expect(
      page.getByRole("heading", { name: "Classroom", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Community message", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Open account", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Welcome back", exact: true }),
    ).toBeVisible();
  }
  await page.goto("/#challenges/atm-balance");
  await expect(
    page.getByRole("heading", {
      name: "ATM: protect the balance",
      exact: true,
    }),
  ).toBeVisible();
});

test("lecturer-owned discussions support reports, reactions and read-only locks without exposing the class", async ({
  browser,
}) => {
  const service = await fixture(),
    ac = await browser.newContext(),
    bc = await browser.newContext();
  try {
    const cls = (
      await service.as(
        A,
        "insert into cq_classes(name,owner_id) values($1,$2) returning id,join_code",
        ["Study circle", A],
      )
    ).rows[0];
    await service.as(B, "select cq_join_class($1,$2)", [
      cls.join_code,
      "Learner B",
    ]);
    const a = await ac.newPage(),
      b = await bc.newPage();
    await service.attach(a);
    await service.attach(b);
    await signin(a, "a@community.test");
    await a
      .getByRole("button", {
        name: "Start Study circle discussion",
        exact: true,
      })
      .click();
    await expect(
      a.getByRole("heading", { name: "Study circle discussion", exact: true }),
    ).toBeVisible();
    await signin(b, "b@community.test");
    await b
      .getByRole("button", { name: "Study circle discussion", exact: true })
      .click();
    await send(a, "Class announcement to enrolled learners only.");
    await expect(
      b.getByRole("region", { name: "Conversation messages" }),
    ).toContainText("Class announcement");
    await b
      .getByRole("button", {
        name: "React 💡 to message by Ada the builder",
        exact: true,
      })
      .click();
    await expect(
      b.getByRole("button", {
        name: "React 💡 to message by Ada the builder",
        exact: true,
      }),
    ).toHaveAttribute("aria-pressed", "true");
    await b.getByRole("button", { name: "Report", exact: true }).click();
    await b
      .getByRole("textbox", {
        name: "What should the moderator know?",
        exact: true,
      })
      .fill("Please review this test announcement.");
    await b.getByRole("button", { name: "Submit report", exact: true }).click();
    await a.getByRole("button", { name: "Sync messages", exact: true }).click();
    await a.getByRole("button", { name: "Moderation", exact: true }).click();
    await expect(
      a.getByText("Please review this test announcement.", { exact: true }),
    ).toBeVisible();
    await a.getByRole("button", { name: "Mark resolved", exact: true }).click();
    expect(
      (await service.as(A, "select status from cq_community_reports")).rows[0]
        .status,
    ).toBe("resolved");
    await a.getByRole("button", { name: "Conversations", exact: true }).click();
    await a
      .getByRole("button", { name: "Lock discussion", exact: true })
      .click();
    await b.getByRole("button", { name: "Sync messages", exact: true }).click();
    await expect(
      b.getByRole("button", { name: "Send message", exact: true }),
    ).toBeDisabled();
    expect(
      (
        await service.as(
          C,
          "select * from cq_community_rooms where class_id=$1",
          [cls.id],
        )
      ).rows,
    ).toHaveLength(0);
  } finally {
    await ac.close();
    await bc.close();
    await service.close();
  }
});

test("unread counts, muting and online history search stay scoped to the chosen conversation", async ({
  browser,
}) => {
  const service = await fixture(),
    ac = await browser.newContext(),
    bc = await browser.newContext();
  try {
    const a = await ac.newPage(),
      b = await bc.newPage();
    await service.attach(a);
    await service.attach(b);
    await signin(a, "a@community.test");
    await signin(b, "b@community.test");
    await channel(a).click();
    await send(a, "Find this unique compiler question.");
    await expect(
      b.getByRole("button", {
        name: "C# workshop 1 unread messages",
        exact: true,
      }),
    ).toBeVisible();
    await channel(b).click();
    await expect(
      b.getByRole("region", { name: "Conversation messages" }),
    ).toContainText("unique compiler");
    await b.getByRole("button", { name: "Mute", exact: true }).click();
    await expect(
      b.getByRole("button", { name: "Unmute", exact: true }),
    ).toBeVisible();
    await b
      .getByRole("button", { name: "General programming", exact: true })
      .click();
    await send(a, "Muted room still stores this message.");
    await b.getByRole("button", { name: "Sync messages", exact: true }).click();
    await expect(
      b.getByRole("button", { name: "C# workshop", exact: true }),
    ).toBeVisible();
    await channel(b).click();
    await b
      .getByRole("textbox", { name: "Search messages", exact: true })
      .fill("unique compiler");
    await b
      .getByRole("button", { name: "Search history online", exact: true })
      .click();
    await expect(
      b.getByRole("region", { name: "Conversation messages" }),
    ).toContainText("Find this unique compiler question.");
    await expect(
      b.getByRole("region", { name: "Conversation messages" }),
    ).not.toContainText("Muted room still");
  } finally {
    await ac.close();
    await bc.close();
    await service.close();
  }
});

test("desktop code opens beside the chat, resizes without overlap and runs only after Run", async ({
  browser,
}) => {
  const service = await fixture(),
    context = await browser.newContext({
      viewport: { width: 1600, height: 1000 },
    });
  try {
    const page = await context.newPage();
    await service.attach(page);
    await signin(page, "a@community.test");
    await page
      .getByRole("button", {
        name: "Attach code or a coding challenge",
        exact: true,
      })
      .click();
    await page
      .getByRole("textbox", { name: "Community code snippet", exact: true })
      .fill('console.log("Side by side: " + (6 * 7))');
    await page
      .getByRole("combobox", { name: "Code language", exact: true })
      .selectOption("javascript");
    await send(page, "Try this code beside our conversation.");
    await page
      .getByRole("button", { name: "Open beside chat", exact: true })
      .click();
    await expect(
      page.getByRole("textbox", { name: "Terminal code editor", exact: true }),
    ).toHaveValue('console.log("Side by side: " + (6 * 7))');
    await expect(
      page.getByRole("region", { name: "Conversation messages" }),
    ).toContainText("Try this code");
    await expect(
      page.getByRole("log", { name: "Terminal console output" }),
    ).not.toContainText("› Side by side: 42");
    const widthSlider = page.getByRole("slider", {
      name: "Chat panel width",
      exact: true,
    });
    await widthSlider.press("Home");
    for (let i = 0; i < 4; i++) await widthSlider.press("ArrowRight");
    await expect(widthSlider).toHaveValue("55");
    const bounds = await page.evaluate(() => {
      const chat = document
          .querySelector(".community-layout")
          .getBoundingClientRect(),
        editor = document
          .querySelector(".community-inline-editor")
          .getBoundingClientRect();
      return {
        chatRight: chat.right,
        editorLeft: editor.left,
        overflow: document.documentElement.scrollWidth > innerWidth + 2,
      };
    });
    expect(bounds.chatRight).toBeLessThanOrEqual(bounds.editorLeft);
    expect(bounds.overflow).toBe(false);
    await page
      .getByRole("button", { name: "Run terminal code", exact: true })
      .click();
    await expect(
      page.getByRole("log", { name: "Terminal console output" }),
    ).toContainText("Side by side: 42");
    await page.screenshot({
      path: "test-results/community-desktop-side-by-side.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Close editor pane", exact: true })
      .click();
    await expect(
      page.getByRole("textbox", { name: "Terminal code editor", exact: true }),
    ).toHaveCount(0);
  } finally {
    await context.close();
    await service.close();
  }
});

test("offline storage upgrades preserve old drafts and snippets without loading other accounts into the list", async ({
  page,
}) => {
  const service = await fixture();
  await service.attach(page);
  const room = (
    await service.as(
      A,
      "select id from cq_community_rooms where slug='general'",
    )
  ).rows[0].id;
  try {
    await page.goto("/startup.css");
    await page.evaluate(
      async ({ ownerId, room }) => {
        const db = await new Promise((resolve, reject) => {
          const request = indexedDB.open("codequest-community-v1", 1);
          request.onupgradeneeded = () =>
            request.result.createObjectStore("records", { keyPath: "id" });
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const tx = db.transaction("records", "readwrite"),
          store = tx.objectStore("records");
        for (const [owner, kind, key, value] of [
          [
            ownerId,
            "draft",
            room,
            {
              body: "Legacy offline draft",
              code: "",
              language: "csharp",
              challenge_id: null,
            },
          ],
          [
            ownerId,
            "snippet",
            "legacy",
            {
              id: "legacy",
              title: "Legacy snippet",
              code: "Console.WriteLine(7);",
              language: "csharp",
            },
          ],
          [
            "other-account",
            "snippet",
            "private",
            {
              id: "private",
              title: "Other account must stay private",
              code: "secret",
              language: "csharp",
            },
          ],
        ])
          store.put({
            id: JSON.stringify([owner, kind, key]),
            owner,
            kind,
            key,
            value,
          });
        await new Promise((resolve, reject) => {
          tx.oncomplete = resolve;
          tx.onerror = reject;
        });
        db.close();
      },
      { ownerId: A, room },
    );
    await signin(page, "a@community.test");
    await expect(
      page.getByRole("textbox", { name: "Community message", exact: true }),
    ).toHaveValue("Legacy offline draft");
    await page
      .getByRole("button", { name: "Code notebook", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Legacy snippet", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Other account must stay private", { exact: true }),
    ).toHaveCount(0);
  } finally {
    await service.close();
  }
});

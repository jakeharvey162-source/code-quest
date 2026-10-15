import { test, expect } from "@playwright/test";
import { practiceQuestion } from "../src/lib/continuous-practice.mjs";
import { codingRemix } from "../src/lib/code-challenges.mjs";
test("beginner receives explanations, completes renewable goals and resumes on a phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/#challenges");
  const arena = page.getByRole("article", { name: "Continuous C# practice" });
  await arena.getByRole("button", { name: "Teach me first" }).click();
  await expect(arena).toContainText("Track one statement");
  for (let i = 0; i < 6; i++) {
    const q = practiceQuestion(i, 0),
      choice = i === 0 ? q.choices.find((c) => c !== q.answer) : q.answer;
    await arena.getByRole("button", { name: choice, exact: true }).click();
    await expect(arena.getByRole("status")).toContainText(q.explanation);
    await expect(
      arena.getByRole("button", { name: choice, exact: true }),
    ).toBeDisabled();
    await arena.getByRole("button", { name: "Next practice question" }).click();
  }
  await expect(arena).toContainText("5/6 correct");
  await expect(arena).toContainText("(1/5)");
  await page.reload();
  await expect(arena).toContainText("Question 7");
  await arena.getByRole("heading",{name:"Practice without a finish line"}).scrollIntoViewIfNeeded();
  await page.screenshot({path:"/tmp/codequest-practice-phone.png"});
  await expect(page.locator(".xp-pill")).toContainText("0 XP");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 2,
    ),
  ).toBe(true);
});
test("coding remixes compile and keep one bounded draft without repeat XP", async ({
  page,
}) => {
  await page.goto("/#settings");
  await page.getByLabel("Editor mode").selectOption("plain");
  await page.goto("/#challenges");
  for (let round = 1; round <= 3; round++) {
    await page.getByRole("button", { name: "New coding remix" }).click();
    const q = codingRemix(round);
    await expect(
      page.getByRole("heading", { name: q.title, exact: true }),
    ).toBeVisible();
    await page.getByLabel("Challenge solution").fill(q.solution);
    await page.getByRole("button", { name: "Run challenge tests" }).click();
    await expect(page.locator(".run-feedback")).toContainText(
      "All tests passed!",
      { timeout: 90000 },
    );
  }
  await expect(page.locator(".xp-pill")).toContainText("0 XP");
  await page.reload();
  await expect(page.getByRole("heading",{name:codingRemix(3).title,exact:true})).toBeVisible();
  await expect(page.getByLabel("Challenge solution")).toHaveValue(codingRemix(3).solution);
  const drafts = await page.evaluate(
    () => JSON.parse(localStorage.getItem("cq-progress-v1")).drafts,
  );
  expect(
    Object.keys(drafts).filter((k) => k.startsWith("challenge-practice")),
  ).toHaveLength(1);
});

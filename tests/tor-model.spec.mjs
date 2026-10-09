import { test, expect } from "@playwright/test";
test("authored 3D Tor renders, walks across the viewport, pauses for interaction and respects reduced motion", async ({
  page,
}) => {
  test.skip(
    !process.env.CODEQUEST_WEBGL_TEST,
    "Software WebGL verification is run separately.",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#designer");
  const model = page.getByTestId("tor-3d"),
    tor = page.getByRole("complementary", { name: "Tor hologram tutor" });
  await expect(model).toHaveAttribute("data-state", "ready", {
    timeout: 20000,
  });
  await expect(model.locator("canvas")).toBeVisible();
  await page.getByRole("button", { name: "Open Tor tutor" }).click();
  await tor.getByLabel("Speak replies automatically").uncheck();
  await tor.getByLabel("Let Tor walk around").check();
  await tor.getByLabel("Ask about C# or your form").fill("What do you see?");
  await tor.getByRole("button", { name: "Explain", exact: true }).click();
  await expect(model).toHaveAttribute("data-animation", /Wave|Idle/);
  await page.getByRole("button", { name: "Minimise Tor" }).click();
  await expect(tor).toHaveAttribute("data-moving", "true", { timeout: 18000 });
  await expect(model).toHaveAttribute("data-animation", "Walking");
  const before = (await tor.boundingBox()).x;
  await expect
    .poll(async () => Math.abs((await tor.boundingBox()).x - before), {
      timeout: 2500,
    })
    .toBeGreaterThan(1);
  await page.getByRole("button", { name: "Open Tor tutor" }).click();
  await expect(tor).toHaveAttribute("data-moving", "false");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(model).toHaveAttribute("data-state", "ready");
  await expect(model).toHaveAttribute("data-animation", "Idle");
  expect(errors).toEqual([]);
  await page.screenshot({ path: "../codequest-tor-3d-local.png" });
});

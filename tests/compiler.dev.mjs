import { test, expect } from "@playwright/test";

test("Vite development worker runs real C# and recovers after compiler diagnostics", async ({
  page,
}) => {
  const worker = await page.request.get(
    "/src/lib/compiler.worker.js?worker_file&type=module",
  );
  expect(worker.status(), await worker.text()).toBe(200);
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const results = await page.evaluate(async () => {
    const { runCSharp } = await import("/src/lib/compiler.ts");
    const first = await runCSharp(
      'using System; Console.WriteLine("Dev runtime: " + (20 + 22));',
    );
    const invalid = await runCSharp(
      "using System; Console.WriteLine(missingVariable);",
    );
    const corrected = await runCSharp(
      'using System; Console.WriteLine("Corrected: " + (6 * 7));',
    );
    return { first, invalid, corrected };
  });
  expect(results.first.success).toBe(true);
  expect(results.first.stdOut.trim()).toBe("Dev runtime: 42");
  expect(results.invalid.success).toBe(false);
  expect(
    results.invalid.diagnostics.some(
      (diagnostic) => diagnostic.id === "CS0103",
    ),
  ).toBe(true);
  expect(results.corrected.success).toBe(true);
  expect(results.corrected.stdOut.trim()).toBe("Corrected: 42");
});

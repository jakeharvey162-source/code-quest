import { test } from "node:test";
import assert from "node:assert/strict";
import { csharpCompletions } from "../src/lib/csharp-completion.mjs";
const hints = (s, extra = "") => csharpCompletions(s, s.length, extra);
test("suggestions reuse declared names with types, not words in comments or strings", () => {
  const result = hints('string name = "secretWord"; // imaginaryName\nna');
  assert.ok(
    result.options.some((x) => x.label === "name" && x.detail === "string"),
  );
  assert.ok(
    !result.options.some((x) =>
      ["secretWord", "imaginaryName"].includes(x.label),
    ),
  );
  assert.equal(hints("// comment "), null);
  assert.equal(hints('string name="hello'), null);
});
test("member hints distinguish string, Console, numeric instance and project class members", () => {
  assert.ok(
    hints('string name=""; name.').options.some((x) => x.label === "Trim"),
  );
  assert.ok(hints("Console.").options.some((x) => x.label === "WriteLine"));
  assert.ok(
    hints("string.").options.some((x) => x.label === "IsNullOrWhiteSpace"),
  );
  assert.ok(
    !hints("int age=3; age.").options.some((x) => x.label === "TryParse"),
  );
  const extra =
    "public class Booking { public string Status {get;set;} public void CompleteBooking() {} }";
  assert.ok(
    hints("var booking = new Booking(); booking.", extra).options.some(
      (x) => x.label === "CompleteBooking",
    ),
  );
});

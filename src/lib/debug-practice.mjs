import { equipmentMission } from "./equipment-practice.mjs";
// Original repair exercises informed by the supplied course concepts.
const exercise = (
  id,
  title,
  category,
  brief,
  starter,
  solution,
  cases,
  hint,
) => ({ id, title, category, brief, starter, solution, cases, hint });
export const debugExercises = [
  equipmentMission(0), equipmentMission(1), equipmentMission(2),
  exercise(
    "validation",
    "The gate that accepts everything",
    "Logic bug",
    "Accept a booking only if the name has at least 3 trimmed characters AND days is from 1 to 7 inclusive. Read name, then days. Print Accepted or Rejected.",
    `using System;
string name = Console.ReadLine() ?? "";
int days;
bool parsed = int.TryParse(Console.ReadLine(), out days);
// @trace name, days, parsed
bool valid = name.Trim().Length >= 3 || (parsed && days >= 1 && days <= 7);
// @trace valid
Console.WriteLine(valid ? "Accepted" : "Rejected");`,
    `using System;
string name = Console.ReadLine() ?? "";
int days;
bool parsed = int.TryParse(Console.ReadLine(), out days);
// @trace name, days, parsed
bool valid = name.Trim().Length >= 3 && parsed && days >= 1 && days <= 7;
// @trace valid
Console.WriteLine(valid ? "Accepted" : "Rejected");`,
    [
      ["Ayo\n1", "Accepted"],
      ["Ayo\n7", "Accepted"],
      ["Ayo\n8", "Rejected"],
      ["Al\n3", "Rejected"],
      ["Ayo\noops", "Rejected"],
      ["   \n2", "Rejected"],
      ["Ayo\n0", "Rejected"],
    ],
    "OR accepts the booking when just one rule passes. Which operator requires every rule to pass?",
  ),
  exercise(
    "statistics",
    "The disappearing bookings",
    "Loop bug",
    "Read comma-separated statuses. Count only Booked records and print the count. Inspect count before each loop update.",
    `using System;
string[] statuses = (Console.ReadLine() ?? "").Split(',');
int count = 0;
foreach (string status in statuses)
{
    // @trace status, count
    if (status.Trim() == "Booked") count++;
    else count--;
}
// @trace count
Console.WriteLine(count);`,
    `using System;
string[] statuses = (Console.ReadLine() ?? "").Split(',');
int count = 0;
foreach (string status in statuses)
{
    // @trace status, count
    if (status.Trim() == "Booked") count++;
}
// @trace count
Console.WriteLine(count);`,
    [
      ["Booked,Completed,Booked", "2"],
      ["Completed,Completed", "0"],
      ["Booked", "1"],
      ["", "0"],
    ],
    "A completed record contributes zero to the active count. It must not subtract an earlier active record.",
  ),
  exercise(
    "constructor",
    "The object forgot its type",
    "OOP repair",
    "Read an equipment type. The constructor must store it, the property must update it, and Complete must update the same object. Print its original type, then Camera, then Completed.",
    `using System;
var booking = new Booking(Console.ReadLine() ?? "");
// @trace booking.Type, booking.Status
Console.WriteLine(booking.Type);
booking.Type = "Camera";
// @trace booking.Type
Console.WriteLine(booking.Type);
booking.Complete();
// @trace booking.Status
Console.WriteLine(booking.Status);
class Booking
{
    private string type = "";
    public string Type { get { return type; } set { type = ""; } }
    public string Status { get; private set; } = "Booked";
    public Booking(string type) { type = type; }
    public void Complete() { Status = "Booked"; }
}`,
    `using System;
var booking = new Booking(Console.ReadLine() ?? "");
// @trace booking.Type, booking.Status
Console.WriteLine(booking.Type);
booking.Type = "Camera";
// @trace booking.Type
Console.WriteLine(booking.Type);
booking.Complete();
// @trace booking.Status
Console.WriteLine(booking.Status);
class Booking
{
    private string type = "";
    public string Type { get { return type; } set { type = value; } }
    public string Status { get; private set; } = "Booked";
    public Booking(string type) { this.type = type; }
    public void Complete() { Status = "Completed"; }
}`,
    [
      ["Laptop", "Laptop\nCamera\nCompleted"],
      ["Tablet", "Tablet\nCamera\nCompleted"],
    ],
    "this.type is the field; type is the constructor parameter. A setter stores value. Changing a property through itself would recurse.",
  ),
  exercise(
    "records",
    "Recover the damaged record",
    "Parsing and runtime errors",
    "Read one name|days|accessories record. Print the trimmed name only when it has 3+ characters, days is 1–7 and accessories is a Boolean. Print Invalid for every other input. This isolates file-line parsing; it does not access your disk.",
    `using System;
string[] fields = (Console.ReadLine() ?? "").Split('|');
// @trace fields.Length
int days = int.Parse(fields[1]);
bool accessories = bool.Parse(fields[2]);
// @trace days, accessories
Console.WriteLine(fields[0].Trim());`,
    `using System;
string[] fields = (Console.ReadLine() ?? "").Split('|');
// @trace fields.Length
int days;
bool accessories;
if (fields.Length == 3 && fields[0].Trim().Length >= 3 &&
    int.TryParse(fields[1], out days) && days >= 1 && days <= 7 &&
    bool.TryParse(fields[2], out accessories))
    Console.WriteLine(fields[0].Trim());
else Console.WriteLine("Invalid");`,
    [
      [" Ayo |3|True", "Ayo"],
      ["Zola|7|False", "Zola"],
      ["bad", "Invalid"],
      ["Ayo|oops|True", "Invalid"],
      ["Ayo|8|True", "Invalid"],
      ["Ayo|3|maybe", "Invalid"],
      ["Al|1|True", "Invalid"],
      ["Ayo|1|True|extra", "Invalid"],
    ],
    "Check field count before indexing. TryParse reports invalid values without crashing. Validate the range after parsing.",
  ),
  exercise(
    "completion",
    "Finish the equipment check",
    "Complete the code",
    "Read an equipment code. Trim and uppercase it. Accept only EQ- followed by at least 3 characters, with no pipe separator. Print the normalized code or Invalid.",
    `using System;
string code = Console.ReadLine() ?? "";
// @trace code
code = /* complete the normalization */;
bool valid = /* complete the rules */;
// @trace code, valid
Console.WriteLine(valid ? code : "Invalid");`,
    `using System;
string code = Console.ReadLine() ?? "";
// @trace code
code = code.Trim().ToUpperInvariant();
bool valid = code.StartsWith("EQ-") && code.Length >= 6 && !code.Contains("|");
// @trace code, valid
Console.WriteLine(valid ? code : "Invalid");`,
    [
      [" eq-l01 ", "EQ-L01"],
      ["EQ-P001", "EQ-P001"],
      ["EQ-1", "Invalid"],
      ["ABC123", "Invalid"],
      ["EQ-|01", "Invalid"],
      ["", "Invalid"],
    ],
    "String methods return a new string. Store the result. A pipe would break a pipe-separated file record.",
  ),
  exercise(
    "compile",
    "Make it build before fixing the answer",
    "Compilation and boundary bugs",
    "Read a mark. Print Pass for 50 or above, otherwise Retry. First repair the compilation error, then test the boundary at exactly 50.",
    `using System;
int mark = int.Parse(Console.ReadLine())
// @trace mark
bool passed = mark > 50;
// @trace mark, passed
Console.WriteLine(passed ? "Pass" : "Retry");`,
    `using System;
int mark = int.Parse(Console.ReadLine());
// @trace mark
bool passed = mark >= 50;
// @trace mark, passed
Console.WriteLine(passed ? "Pass" : "Retry");`,
    [
      ["49", "Retry"],
      ["50", "Pass"],
      ["100", "Pass"],
    ],
    "Read the first compiler error first. After it builds, > and >= behave differently at the exact boundary.",
  ),
  exercise(
    "events",
    "The button that does nothing",
    "Event wiring",
    "This console model of a button practises event subscriptions. Read a click count, attach Capture to Click, and print how many captures occurred. Each click must capture once. Native WinForms uses the same event-subscription concept with its own event arguments.",
    `using System;
int clicks = int.Parse(Console.ReadLine());
var button = new PracticeButton();
int captures = 0;
// TODO: subscribe Capture to the button Click event
for (int i = 0; i < clicks; i++)
{
    // @trace i, captures
    button.Press();
}
// @trace captures
Console.WriteLine(captures);
void Capture() { captures++; }
class PracticeButton
{
    public event Action Click;
    public void Press() { Click?.Invoke(); }
}`,
    `using System;
int clicks = int.Parse(Console.ReadLine());
var button = new PracticeButton();
int captures = 0;
button.Click += Capture;
for (int i = 0; i < clicks; i++)
{
    // @trace i, captures
    button.Press();
}
// @trace captures
Console.WriteLine(captures);
void Capture() { captures++; }
class PracticeButton
{
    public event Action Click;
    public void Press() { Click?.Invoke(); }
}`,
    [
      ["3", "3"],
      ["0", "0"],
      ["1", "1"],
    ],
    "Declaring a handler does not connect it. Subscribe with += once, outside the loop. Calling it immediately is not a subscription.",
  ),
];

export function traceProgram(source, token) {
  if (source.length > 50000)
    throw Error("Keep repair programs below 50,000 characters.");
  const name = "CQTrace_" + token.replace(/[^a-zA-Z0-9]/g, "");
  // Only recognize standalone line comments, never text inside strings or block comments.
  const eligible = new Set();
  const tokens =
    /\/\/[^\n]*|\/\*[\s\S]*?\*\/|(?<raw>"{3,})[\s\S]*?\k<raw>|@"(?:[^"]|"")*"|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'/g;
  for (const token of source.matchAll(tokens)) {
    if (
      token[0].startsWith("//") &&
      !source
        .slice(source.lastIndexOf("\n", token.index - 1) + 1, token.index)
        .trim()
    )
      eligible.add(source.slice(0, token.index).split("\n").length - 1);
  }
  const lines = source.split("\n");
  const points = [];
  const transformed = lines
    .map((line, index) => {
      const match = line.match(/^\s*\/\/\s*@trace\s+(.+)$/);
      if (!match || !eligible.has(index)) return line;
      const watches = match[1].split(",").map((x) => x.trim());
      if (
        watches.length > 12 ||
        watches.some((x) => !/^\w+(?:\.\w+)*$/.test(x))
      )
        throw Error(
          "Trace watches must be simple variable or property names, separated by commas (up to 12).",
        );
      points.push({ line: index + 1, watches });
      return `${name}.Capture(${index + 1}, new object[]{${watches.join(",")}});`;
    })
    .join("\n");
  const helper = `\ninternal static class ${name} {
 static int count=0;
 public static void Capture(int line, object[] values) {
  if (++count > 150) throw new System.InvalidOperationException("Trace limit reached (150 snapshots). Shorten the loop or remove trace points.");
  string row="${token}|"+line;
  foreach(object value in values) row += "|"+System.Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(value == null ? "null" : System.Convert.ToString(value, System.Globalization.CultureInfo.InvariantCulture)));
  System.Console.WriteLine(row);
 }
}`;
  return { source: transformed + helper, points };
}
export function readTrace(output, token, points) {
  let visible = "";
  const frames = [];
  for (const line of (output || "").split(/(?<=\n)/)) {
    if (!line.startsWith(token + "|")) {
      visible += line;
      continue;
    }
    const parts = line.trimEnd().split("|");
    const point = points.find((p) => p.line === Number(parts[1]));
    if (!point) continue;
    try {
      frames.push({
        line: point.line,
        output: visible,
        watches: point.watches.map((name, i) => ({
          name,
          value: new TextDecoder().decode(
            Uint8Array.from(atob(parts[i + 2] || ""), (c) => c.charCodeAt(0)),
          ),
        })),
      });
    } catch {
      visible += line;
    }
  }
  return { frames, output: visible };
}
export const normalizedOutput = (value) =>
  (value || "").replace(/\r\n/g, "\n").trim();

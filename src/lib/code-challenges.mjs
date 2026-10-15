const task = (id, level, title, brief, signature, cases, solution, hint) => ({
  id,
  level,
  title,
  brief,
  signature,
  cases,
  solution,
  hint,
  xp:
    level === "easy"
      ? 40
      : level === "intermediate"
        ? 70
        : level === "advanced"
          ? 100
          : 140,
  starter:
    signature +
    "\n{\n    // Your solution here\n    throw new NotImplementedException();\n}",
});
export const codeChallenges = [
  task(
    "bill-total",
    "easy",
    "Split the bill",
    "Return the total cost: price multiplied by quantity.",
    "public static decimal Total(decimal price, int quantity)",
    [
      ["Total(25m, 3)", "75m"],
      ["Total(0m, 5)", "0m"],
      ["Total(12.5m, 2)", "25m"],
    ],
    "public static decimal Total(decimal price, int quantity) { return price * quantity; }",
    "Use multiplication. Keep money as decimal.",
  ),
  task(
    "age-gate",
    "easy",
    "Guard the door",
    "Return true when age is at least 18.",
    "public static bool CanEnter(int age)",
    [
      ["CanEnter(17)", "false"],
      ["CanEnter(18)", "true"],
      ["CanEnter(60)", "true"],
      ["CanEnter(0)", "false"],
    ],
    "public static bool CanEnter(int age) { return age >= 18; }",
    "Test the boundary: 18 is allowed, 17 is not.",
  ),
  task(
    "student-id",
    "intermediate",
    "Eight digits, no excuses",
    "Accept exactly eight ASCII digits. Reject null, spaces and letters.",
    "public static bool ValidStudent(string value)",
    [
      ['ValidStudent("12345678")', "true"],
      ['ValidStudent("1234567")', "false"],
      ['ValidStudent("1234567a")', "false"],
      ["ValidStudent(null)", "false"],
      ['ValidStudent("１２３４５６７８")', "false"],
    ],
    "public static bool ValidStudent(string value) { return value != null && value.Length == 8 && value.All(c => c >= '0' && c <= '9'); }",
    "Check null first, then length, then EVERY character. A character is not an integer.",
  ),
  task(
    "sum-positive",
    "intermediate",
    "Rescue the positives",
    "Sum only positive numbers in an array. An empty array returns zero.",
    "public static int SumPositive(int[] values)",
    [
      ["SumPositive(new int[]{3,-2,7,0})", "10"],
      ["SumPositive(new int[]{})", "0"],
      ["SumPositive(new int[]{-4,-1})", "0"],
    ],
    "public static int SumPositive(int[] values) { int total=0; foreach(int n in values) if(n>0) total+=n; return total; }",
    "Start a running total at zero; add only values greater than zero.",
  ),
  task(
    "safe-amount",
    "advanced",
    "No crashing at checkout",
    "Parse a nonnegative decimal amount using invariant culture. Return -1 for invalid or negative input.",
    "public static decimal Amount(string text)",
    [
      ['Amount("12.50")', "12.5m"],
      ['Amount("oops")', "-1m"],
      ['Amount("-2")', "-1m"],
      ['Amount("0")', "0m"],
    ],
    "public static decimal Amount(string text) { decimal n; return decimal.TryParse(text, NumberStyles.Number, CultureInfo.InvariantCulture, out n) && n >= 0 ? n : -1m; }",
    "TryParse returns a bool. It avoids throwing for ordinary bad input.",
  ),
  task(
    "loan-payment",
    "pro",
    "Loan calculator boss",
    "Return the monthly payment for an interest-free loan. Throw ArgumentException if principal is negative or months is zero/negative.",
    "public static decimal Payment(decimal principal, int months)",
    [
      ["Payment(1200m,12)", "100m"],
      ["Payment(0m,12)", "0m"],
      ["Payment(900m,3)", "300m"],
    ],
    "public static decimal Payment(decimal principal, int months) { if(principal<0 || months<=0) throw new ArgumentException(); return principal/months; }",
    "Validate before dividing; test a zero-month loan. Add guards, not a catch that hides every error.",
  ),
  task(
    "atm-balance",
    "pro",
    "ATM: protect the balance",
    "Return the new balance after withdrawal. Reject nonpositive amounts or amounts greater than the balance by leaving it unchanged.",
    "public static decimal Withdraw(decimal balance, decimal amount)",
    [
      ["Withdraw(1000m,250m)", "750m"],
      ["Withdraw(100m,150m)", "100m"],
      ["Withdraw(100m,-5m)", "100m"],
      ["Withdraw(100m,0m)", "100m"],
      ["Withdraw(100m,100m)", "0m"],
    ],
    "public static decimal Withdraw(decimal balance, decimal amount) { return amount > 0 && amount <= balance ? balance-amount : balance; }",
    "Think about negative withdrawals: subtracting a negative amount would create money!",
  ),
];
export function challengeXp(steps) {
  return codeChallenges
    .filter((c) => new Set(steps["code-challenges"] || []).has(c.id))
    .reduce((n, c) => n + c.xp, 0);
}
export function challengeProgram(challenge, source, token) {
  if (source.length > 50000)
    throw Error("Keep your solution below 50,000 characters.");
  const checks = challenge.cases
    .map(
      ([call, expected], i) =>
        `try { var actual=Solution.${call}; bool passed=actual==${expected}; Console.WriteLine("${token}|${i}|"+(passed?"PASS":"FAIL")+"|"+Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(Convert.ToString(actual,CultureInfo.InvariantCulture)))); } catch(Exception ex) { Console.WriteLine("${token}|${i}|FAIL|"+Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(ex.GetType().Name))); }`,
    )
    .join("\n");
  const guards =
    challenge.id === "loan-payment"
      ? ["Payment(10m,0)", "Payment(10m,-1)", "Payment(-10m,2)"]
          .map(
            (call, i) =>
              `try { Solution.${call}; Console.WriteLine("${token}|${challenge.cases.length + i}|FAIL|"); } catch(ArgumentException) {Console.WriteLine("${token}|${challenge.cases.length + i}|PASS|");} catch(Exception){Console.WriteLine("${token}|${challenge.cases.length + i}|FAIL|");}`,
          )
          .join("\n")
      : "";
  return (
    "using System;\nusing System.Linq;\nusing System.Globalization;\n" +
    checks +
    "\n" +
    guards +
    "\npublic static class Solution {\n" +
    source +
    "\n}"
  );
}
export function challengeResults(challenge, output, token) {
  const count =
    challenge.cases.length + (challenge.id === "loan-payment" ? 3 : 0);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const line = output
      .split(/\r?\n/)
      .find((l) => l.startsWith(token + "|" + i + "|"));
    const bits = line?.split("|");
    let actual = "No result";
    try {
      if (bits?.[3])
        actual = new TextDecoder().decode(
          Uint8Array.from(atob(bits[3]), (c) => c.charCodeAt(0)),
        );
    } catch {}
    rows.push({ passed: bits?.[2] === "PASS", actual });
  }
  return rows;
}

// Renewable practice uses one draft slot and no repeat XP.
export function codingRemix(round=0){
 const seed=Number.isSafeInteger(round)&&round>=0?round:0,threshold=30+seed%51,fee=1+seed%25;
 const variants=[
 task('practice-remix','easy','Pass mark remix',`Return true when mark is at least ${threshold}. Marks outside 0–100 must return false.`,'public static bool Pass(int mark)',[[`Pass(${threshold-1})`,'false'],[`Pass(${threshold})`,'true'],['Pass(100)','true'],['Pass(-1)','false'],['Pass(101)','false']],`public static bool Pass(int mark) { return mark >= ${threshold} && mark <= 100; }`,'Use && to require both the pass mark and maximum valid mark.'),
 task('practice-remix','intermediate','Delivery fee remix',`Return price × quantity plus a delivery fee of ${fee}. Zero quantity costs zero. Test inputs are non-negative.`,'public static decimal Cost(decimal price, int quantity)',[['Cost(10m, 2)',`${20+fee}m`],['Cost(2.5m, 3)',`${7.5+fee}m`],['Cost(10m, 0)','0m'],['Cost(0m, 1)',`${fee}m`]],`public static decimal Cost(decimal price, int quantity) { return quantity == 0 ? 0m : price * quantity + ${fee}m; }`,'Handle zero quantity before adding delivery. Keep decimal money exact.'),
 task('practice-remix','intermediate','Clean text remix','Trim outer whitespace and return the first character in uppercase. Null, empty and whitespace-only input must return an empty string.','public static string Initial(string text)',[['Initial(" learner ")','"L"'],['Initial("")','""'],['Initial(null)','""'],['Initial("   ")','""'],['Initial("code")','"C"']],'public static string Initial(string text) { return string.IsNullOrWhiteSpace(text) ? "" : text.Trim().Substring(0,1).ToUpperInvariant(); }','Check null or whitespace before indexing.')];
 return {...variants[seed%3],xp:0,title:variants[seed%3].title+` · ${seed+1}`};
}

import { addControl } from "../designer-engine.mjs";
import { reviewSource } from "./assessment-engine.mjs";
function form(definitions) {
  let controls = [];
  for (const [type, name, text, x, y, width, height, extra] of definitions) {
    controls = addControl(controls, type);
    Object.assign(
      controls.at(-1),
      { name, text, x, y, width, height },
      extra || {},
    );
  }
  return controls;
}
const moneyControls = form([
  ["Label", "lblBalance", "Balance: R1000.00", 24, 20, 250, 34],
  ["Label", "lblAmount", "Amount (R)", 24, 68, 150, 28],
  ["TextBox", "txtAmount", "", 24, 100, 180, 34],
  [
    "Button",
    "btnDeposit",
    "Deposit",
    230,
    100,
    130,
    34,
    { eventClick: "btnDeposit_Click" },
  ],
  [
    "Button",
    "btnWithdraw",
    "Withdraw",
    380,
    100,
    130,
    34,
    { eventClick: "btnWithdraw_Click" },
  ],
  [
    "DataGridView",
    "dgvTransactions",
    "",
    24,
    168,
    580,
    190,
    { columns: "Type|Transaction\nAmount|Amount (R)\nBalance|Balance (R)" },
  ],
]);
const moneyCode = `private decimal balance = 1000m;
private bool ReadAmount(out decimal amount)
{
    if (!decimal.TryParse(txtAmount.Text, out amount) || amount <= 0)
    {
        MessageBox.Show("Enter a positive amount");
        return false;
    }
    return true;
}
private void btnDeposit_Click(object sender, EventArgs e)
{
    decimal amount;
    if (!ReadAmount(out amount)) return;
    balance += amount;
    lblBalance.Text = "Balance: R" + balance.ToString("F2");
    dgvTransactions.Rows.Add("Deposit", amount.ToString("F2"), balance.ToString("F2"));
}
private void btnWithdraw_Click(object sender, EventArgs e)
{
    decimal amount;
    if (!ReadAmount(out amount)) return;
    if (amount > balance) { MessageBox.Show("Insufficient funds"); return; }
    balance -= amount;
    lblBalance.Text = "Balance: R" + balance.ToString("F2");
    dgvTransactions.Rows.Add("Withdrawal", amount.ToString("F2"), balance.ToString("F2"));
}`;
const loanControls = form([
  ["Label", "lblPrincipal", "Loan amount (R)", 24, 20, 180, 28],
  ["TextBox", "txtPrincipal", "", 24, 56, 180, 34],
  ["Label", "lblRate", "Annual interest (%)", 24, 108, 180, 28],
  ["TextBox", "txtRate", "", 24, 144, 180, 34],
  ["Label", "lblMonths", "Repayment months", 240, 20, 180, 28],
  [
    "NumericUpDown",
    "nudMonths",
    "",
    240,
    56,
    150,
    34,
    { minimum: 1, maximum: 360, value: 12 },
  ],
  [
    "Button",
    "btnCalculate",
    "Calculate",
    240,
    144,
    150,
    34,
    { eventClick: "btnCalculate_Click" },
  ],
  ["Label", "lblPayment", "Monthly repayment", 24, 206, 400, 34],
  [
    "DataGridView",
    "dgvQuotes",
    "",
    24,
    254,
    580,
    140,
    {
      columns:
        "Principal|Principal (R)\nRate|Annual rate (%)\nMonths|Months\nPayment|Monthly payment (R)",
    },
  ],
]);
const loanCode = `private void btnCalculate_Click(object sender, EventArgs e)
{
    double principal, annualRate;
    if (!double.TryParse(txtPrincipal.Text, out principal) || principal <= 0 || double.IsInfinity(principal) || double.IsNaN(principal))
    { MessageBox.Show("Enter a positive loan amount"); return; }
    if (!double.TryParse(txtRate.Text, out annualRate) || annualRate < 0 || double.IsInfinity(annualRate) || double.IsNaN(annualRate))
    { MessageBox.Show("Enter a valid interest rate"); return; }
    int months = (int)nudMonths.Value;
    double rate = annualRate / 100 / 12;
    double payment = rate == 0 ? principal / months : principal * rate / (1 - Math.Pow(1 + rate, -months));
    lblPayment.Text = "Monthly repayment: R" + payment.ToString("F2");
    dgvQuotes.Rows.Add(principal.ToString("F2"), annualRate.ToString("F2"), months, payment.ToString("F2"));
}`;
const bankControls = form([
  ["Label", "lblCustomer", "Customer name", 24, 20, 150, 28],
  ["TextBox", "txtCustomer", "", 24, 56, 180, 34],
  ["Label", "lblOpening", "Opening balance (R)", 240, 20, 180, 28],
  ["TextBox", "txtOpening", "", 240, 56, 180, 34],
  [
    "Button",
    "btnAdd",
    "Add account",
    450,
    56,
    150,
    34,
    { eventClick: "btnAdd_Click" },
  ],
  [
    "Button",
    "btnRemove",
    "Remove selected",
    24,
    110,
    160,
    34,
    { eventClick: "btnRemove_Click" },
  ],
  [
    "DataGridView",
    "dgvAccounts",
    "",
    24,
    164,
    580,
    210,
    { columns: "Customer|Customer\nBalance|Balance (R)" },
  ],
]);
const bankCode = `private void btnAdd_Click(object sender, EventArgs e)
{
    decimal opening;
    if (string.IsNullOrWhiteSpace(txtCustomer.Text)) { MessageBox.Show("Enter a customer name"); return; }
    if (!decimal.TryParse(txtOpening.Text, out opening) || opening < 0) { MessageBox.Show("Enter a valid opening balance"); return; }
    foreach (DataGridViewRow row in dgvAccounts.Rows)
    {
        if (Convert.ToString(row.Cells["Customer"].Value, System.Globalization.CultureInfo.InvariantCulture).Equals(txtCustomer.Text.Trim(), StringComparison.OrdinalIgnoreCase))
        { MessageBox.Show("Customer already exists"); return; }
    }
    dgvAccounts.Rows.Add(txtCustomer.Text.Trim(), opening.ToString("F2"));
    txtCustomer.Clear();
}
private void btnRemove_Click(object sender, EventArgs e)
{
    if (dgvAccounts.SelectedRows.Count == 0) { MessageBox.Show("Select an account first"); return; }
    dgvAccounts.Rows.RemoveAt(dgvAccounts.SelectedRows[0].Index);
}`;
export const systemProjects = [
  {
    id: "atm-system",
    title: "ATM transaction system",
    controls: ["TextBox", "Button", "Label", "DataGridView"],
    requirements: [
      "Start with R1000",
      "Accept positive deposits and withdrawals",
      "Reject overdrafts and invalid amounts",
      "Keep the balance between clicks",
      "Record each successful transaction",
    ],
    template: moneyControls,
    solution: moneyCode,
    starter:
      "private decimal balance = 1000m;\nprivate void btnDeposit_Click(object sender, EventArgs e)\n{\n    // Validate amount, update balance, update Label and add a transaction row.\n}\nprivate void btnWithdraw_Click(object sender, EventArgs e)\n{\n    // Reject overdrafts before changing the balance.\n}",
    tests: [
      {
        name: "Deposit adds money",
        input: { txtAmount: "250" },
        click: "btnDeposit",
        expect: {
          label: "lblBalance",
          text: "Balance: R1250.00",
          grid: "dgvTransactions",
          rows: 1,
          lastRow: ["Deposit", "250.00", "1250.00"],
        },
      },
      {
        name: "Withdrawal preserves prior balance",
        input: { txtAmount: "100" },
        click: "btnWithdraw",
        expect: {
          label: "lblBalance",
          text: "Balance: R1150.00",
          grid: "dgvTransactions",
          rows: 2,
          lastRow: ["Withdrawal", "100.00", "1150.00"],
        },
      },
      {
        name: "Overdraft rejected without changing state",
        input: { txtAmount: "5000" },
        click: "btnWithdraw",
        expect: {
          message: true,
          label: "lblBalance",
          text: "Balance: R1150.00",
          grid: "dgvTransactions",
          rows: 2,
        },
      },
      {
        name: "Invalid number rejected",
        input: { txtAmount: "abc" },
        click: "btnDeposit",
        expect: { message: true, grid: "dgvTransactions", rows: 2 },
      },
      {
        name: "Negative deposit rejected",
        input: { txtAmount: "-20" },
        click: "btnDeposit",
        expect: {
          message: true,
          label: "lblBalance",
          text: "Balance: R1150.00",
          grid: "dgvTransactions",
          rows: 2,
        },
      },
    ],
  },
  {
    id: "loan-system",
    title: "Loan repayment calculator",
    controls: ["TextBox", "NumericUpDown", "Button", "Label", "DataGridView"],
    requirements: [
      "Validate loan amount and interest",
      "Read repayment months",
      "Use the monthly amortisation formula",
      "Handle zero interest",
      "Store each valid quote",
    ],
    template: loanControls,
    solution: loanCode,
    starter:
      "private void btnCalculate_Click(object sender, EventArgs e)\n{\n    // TryParse inputs, calculate repayment, update Label and quote history.\n}",
    tests: [
      {
        name: "Zero-interest repayment",
        input: { txtPrincipal: "1200", txtRate: "0", nudMonths: 12 },
        click: "btnCalculate",
        expect: {
          label: "lblPayment",
          text: "Monthly repayment: R100.00",
          grid: "dgvQuotes",
          rows: 1,
          lastRow: ["1200.00", "0.00", "12", "100.00"],
        },
      },
      {
        name: "Monthly compounding at 12%",
        input: { txtPrincipal: "1200", txtRate: "12", nudMonths: 12 },
        click: "btnCalculate",
        expect: {
          label: "lblPayment",
          text: "Monthly repayment: R106.62",
          grid: "dgvQuotes",
          rows: 2,
          lastRow: ["1200.00", "12.00", "12", "106.62"],
        },
      },
      {
        name: "Invalid principal rejected",
        input: { txtPrincipal: "bad", txtRate: "12" },
        click: "btnCalculate",
        expect: { message: true, grid: "dgvQuotes", rows: 2 },
      },
      {
        name: "Negative interest rejected",
        input: { txtPrincipal: "1200", txtRate: "-1" },
        click: "btnCalculate",
        expect: { message: true, grid: "dgvQuotes", rows: 2 },
      },
    ],
  },
  {
    id: "bank-manager",
    title: "Bank account manager",
    controls: ["TextBox", "Button", "DataGridView"],
    requirements: [
      "Add accounts with a non-empty name",
      "Validate a non-negative opening balance",
      "Reject duplicate names",
      "Read the selected DataGridView row",
      "Remove only the selected account",
    ],
    template: bankControls,
    solution: bankCode,
    starter:
      "private void btnAdd_Click(object sender, EventArgs e)\n{\n    // Validate name and balance, reject duplicates, add a row.\n}\nprivate void btnRemove_Click(object sender, EventArgs e)\n{\n    // Check selection and remove its row.\n}",
    tests: [
      {
        name: "Valid account added",
        input: { txtCustomer: "Ada", txtOpening: "500" },
        click: "btnAdd",
        expect: { grid: "dgvAccounts", rows: 1, lastRow: ["Ada", "500.00"] },
      },
      {
        name: "Duplicate name rejected",
        input: { txtCustomer: "ada", txtOpening: "100" },
        click: "btnAdd",
        expect: { message: true, grid: "dgvAccounts", rows: 1 },
      },
      {
        name: "Negative balance rejected",
        input: { txtCustomer: "Harvey", txtOpening: "-1" },
        click: "btnAdd",
        expect: { message: true, grid: "dgvAccounts", rows: 1 },
      },
      {
        name: "Selected account removed",
        input: { dgvAccounts: 0 },
        click: "btnRemove",
        expect: { grid: "dgvAccounts", rows: 0 },
      },
      {
        name: "Missing selection handled",
        input: { dgvAccounts: -1 },
        click: "btnRemove",
        expect: { message: true, grid: "dgvAccounts", rows: 0 },
      },
    ],
  },
];
export function gradeSystemDesign(project, controls, source) {
  const code = reviewSource(source),
    count = (xs, p) => xs.filter(p).length;
  const buttons = controls.filter((c) => c.type === "Button");
  const breakdown = {
    "Required controls": Math.round(
      (15 *
        count(project.controls, (t) => controls.some((c) => c.type === t))) /
        project.controls.length,
    ),
    "Meaningful names": Math.round(
      (5 *
        count(controls, (c) =>
          /^(txt|btn|lbl|dgv|nud|rtb|prg)[A-Z]/.test(c.name),
        )) /
        Math.max(1, controls.length),
    ),
    "Event wiring": Math.round(
      (10 *
        count(
          buttons,
          (c) =>
            /^[A-Za-z_]\w*$/.test(c.eventClick || "") &&
            new RegExp("\\bvoid\\s+" + c.eventClick + "\\s*\\(").test(code),
        )) /
        Math.max(1, buttons.length),
    ),
    "Input validation":
      (/(?:decimal|double|int)\.TryParse\s*\(/.test(code) ? 5 : 0) +
      (/\bif\s*\(/.test(code) && /\breturn\b/.test(code) ? 5 : 0),
    "DataGridView logic": /\.Rows\.(?:Add|RemoveAt)\s*\(/.test(code) ? 10 : 0,
  };
  return {
    breakdown,
    earned: Object.values(breakdown).reduce((a, b) => a + b, 0),
    max: 50,
  };
}

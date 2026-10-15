export const consoleChallenges = [
  {
    id: "hello",
    title: "Hello, learner",
    brief:
      "Read a name and print Hello, followed by that name. Fix the missing output statement, then test different names.",
    starter:
      'using System;\nConsole.Write("Your name: ");\nstring name = Console.ReadLine() ?? "";\n// TODO: print Hello, followed by name.\n',
    solution:
      'using System;\nConsole.Write("Your name: ");\nstring name = Console.ReadLine() ?? "";\nConsole.WriteLine("Hello, " + name);',
    cases: [
      ["Ayo", "Your name: Hello, Ayo"],
      ["Lebo", "Your name: Hello, Lebo"],
    ],
  },
  {
    id: "add",
    title: "Two numbers, one total",
    brief:
      "Read two whole numbers. Print Total: and their sum. If either input is invalid, print Invalid number. Fix the string concatenation bug and add validation.",
    starter:
      'using System;\nConsole.Write("First number: ");\nstring first = Console.ReadLine();\nConsole.Write("Second number: ");\nstring second = Console.ReadLine();\nConsole.WriteLine("Total: " + first + second);',
    solution:
      'using System;\nConsole.Write("First number: ");\nstring first = Console.ReadLine();\nConsole.Write("Second number: ");\nstring second = Console.ReadLine();\nint a, b;\nif (int.TryParse(first, out a) && int.TryParse(second, out b))\n    Console.WriteLine("Total: " + (a + b));\nelse Console.WriteLine("Invalid number");',
    cases: [
      ["2\n3", "First number: Second number: Total: 5"],
      ["-4\n2", "First number: Second number: Total: -2"],
      ["oops\n3", "First number: Second number: Invalid number"],
    ],
  },
  {
    id: "count",
    title: "Countdown launch",
    brief:
      "Read a whole number from 1 to 5. Print each number down to 1 on a separate line, then Lift off!. Print Invalid count for anything else. Repair the loop direction and validation.",
    starter:
      'using System;\nint count = int.Parse(Console.ReadLine());\nfor (int i = 1; i <= count; i++) Console.WriteLine(i);\nConsole.WriteLine("Lift off!");',
    solution:
      'using System;\nint count;\nif (!int.TryParse(Console.ReadLine(), out count) || count < 1 || count > 5) Console.WriteLine("Invalid count");\nelse {\n    for (int i = count; i >= 1; i--) Console.WriteLine(i);\n    Console.WriteLine("Lift off!");\n}',
    cases: [
      ["3", "3\n2\n1\nLift off!"],
      ["1", "1\nLift off!"],
      ["6", "Invalid count"],
      ["oops", "Invalid count"],
    ],
  },
];

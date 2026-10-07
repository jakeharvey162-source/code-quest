export type Challenge={task:string;starter:string;solution:string;harness:string;expected:string};
export type Question={question:string;options:string[];answer:number;explanation:string};
export type Lesson={id:string;title:string;track:string;kind:'code'|'quiz';minutes:number;concept:string;example:string;prediction?:Question;build?:Challenge;debug?:string;apply?:Challenge;questions?:Question[]};
export const tracks=[{id:'lagos',name:'Lagos',subtitle:'Rookie Street',description:'C# fundamentals',color:'#efb934',count:9},{id:'jozi',name:'Johannesburg',subtitle:'The Makers Yard',description:'WinForms & useful interfaces',color:'#5bb6a0',count:6},{id:'kinshasa',name:'Kinshasa',subtitle:'Object Kingdom',description:'Classes, contracts & behaviour',color:'#ed8068',count:6}];
export const lessons:Lesson[]=[
  {
    "id": "variables",
    "title": "The price of a plan",
    "track": "lagos",
    "kind": "code",
    "minutes": 12,
    "concept": "A variable stores a value with a type. Multiply price by quantity to calculate the total.",
    "example": "public class Solution\n{\n    public static int Total(int price, int quantity)\n    {\n        return price * quantity;\n    }\n}",
    "prediction": {
      "question": "What is Total(10, 3)?",
      "options": [
        "13",
        "30",
        "103"
      ],
      "answer": 1,
      "explanation": "A variable stores a value with a type. Multiply price by quantity to calculate the total."
    },
    "build": {
      "task": "Complete int Total(int price, int quantity). A variable stores a value with a type. Multiply price by quantity to calculate the total.",
      "starter": "public class Solution\n{\n    public static int Total(int price, int quantity)\n    {\n        return 0;\n    }\n}",
      "solution": "public class Solution\n{\n    public static int Total(int price, int quantity)\n    {\n        return price * quantity;\n    }\n}",
      "harness": "Console.WriteLine(Solution.Total(10, 3));\nConsole.WriteLine(Solution.Total(7, 4));\nConsole.WriteLine(Solution.Total(0, 5));",
      "expected": "30\n28\n0"
    },
    "debug": "public class Solution\n{\n    public static int Total(int price, int quantity)\n    {\n        return price + quantity;\n    }\n}",
    "apply": {
      "task": "Apply the idea independently: implement int Change(int paid, int cost).",
      "starter": "public class Solution\n{\n    public static int Change(int paid, int cost)\n    {\n        return 0;\n    }\n}",
      "solution": "public class Solution\n{\n    public static int Change(int paid, int cost)\n    {\n        return paid - cost;\n    }\n}",
      "harness": "Console.WriteLine(Solution.Change(100, 70));\nConsole.WriteLine(Solution.Change(50, 50));\nConsole.WriteLine(Solution.Change(25, 9));",
      "expected": "30\n0\n16"
    }
  },
  {
    "id": "strings",
    "title": "Names have a type",
    "track": "lagos",
    "kind": "code",
    "minutes": 12,
    "concept": "Strings store text. Use + to join text and values. Include spaces where the message needs them.",
    "example": "public class Solution\n{\n    public static string Greet(string name)\n    {\n        return \"Hello, \" + name;\n    }\n}",
    "prediction": {
      "question": "What does Greet(\"Ada\") return?",
      "options": [
        "Hello, Ada",
        "AdaHello",
        "HelloAda"
      ],
      "answer": 0,
      "explanation": "Strings store text. Use + to join text and values. Include spaces where the message needs them."
    },
    "build": {
      "task": "Complete string Greet(string name). Strings store text. Use + to join text and values. Include spaces where the message needs them.",
      "starter": "public class Solution\n{\n    public static string Greet(string name)\n    {\n        return \"\";\n    }\n}",
      "solution": "public class Solution\n{\n    public static string Greet(string name)\n    {\n        return \"Hello, \" + name;\n    }\n}",
      "harness": "Console.WriteLine(Solution.Greet(\"Ada\"));\nConsole.WriteLine(Solution.Greet(\"Tor\"));",
      "expected": "Hello, Ada\nHello, Tor"
    },
    "debug": "public class Solution\n{\n    public static string Greet(string name)\n    {\n        return \"Hello,\" + name;\n    }\n}",
    "apply": {
      "task": "Apply the idea independently: implement string Label(string item, int count).",
      "starter": "public class Solution\n{\n    public static string Label(string item, int count)\n    {\n        return \"\";\n    }\n}",
      "solution": "public class Solution\n{\n    public static string Label(string item, int count)\n    {\n        return item + \": \" + count;\n    }\n}",
      "harness": "Console.WriteLine(Solution.Label(\"Books\", 3));\nConsole.WriteLine(Solution.Label(\"Forms\", 1));",
      "expected": "Books: 3\nForms: 1"
    }
  },
  {
    "id": "conditions",
    "title": "The age gate",
    "track": "lagos",
    "kind": "code",
    "minutes": 12,
    "concept": "A condition chooses behaviour. >= includes the boundary value; > does not.",
    "example": "public class Solution\n{\n    public static bool CanEnter(int age)\n    {\n        return age >= 18;\n    }\n}",
    "prediction": {
      "question": "CanEnter(18) with age >= 18 returns…",
      "options": [
        "False",
        "True",
        "18"
      ],
      "answer": 1,
      "explanation": "A condition chooses behaviour. >= includes the boundary value; > does not."
    },
    "build": {
      "task": "Complete bool CanEnter(int age). A condition chooses behaviour. >= includes the boundary value; > does not.",
      "starter": "public class Solution\n{\n    public static bool CanEnter(int age)\n    {\n        return false;\n    }\n}",
      "solution": "public class Solution\n{\n    public static bool CanEnter(int age)\n    {\n        return age >= 18;\n    }\n}",
      "harness": "Console.WriteLine(Solution.CanEnter(17));\nConsole.WriteLine(Solution.CanEnter(18));\nConsole.WriteLine(Solution.CanEnter(25));",
      "expected": "False\nTrue\nTrue"
    },
    "debug": "public class Solution\n{\n    public static bool CanEnter(int age)\n    {\n        return age > 18;\n    }\n}",
    "apply": {
      "task": "Apply the idea independently: implement bool Passed(int mark).",
      "starter": "public class Solution\n{\n    public static bool Passed(int mark)\n    {\n        return false;\n    }\n}",
      "solution": "public class Solution\n{\n    public static bool Passed(int mark)\n    {\n        return mark >= 50;\n    }\n}",
      "harness": "Console.WriteLine(Solution.Passed(49));\nConsole.WriteLine(Solution.Passed(50));\nConsole.WriteLine(Solution.Passed(80));",
      "expected": "False\nTrue\nTrue"
    }
  },
  {
    "id": "logic",
    "title": "Two keys, one door",
    "track": "lagos",
    "kind": "code",
    "minutes": 12,
    "concept": "&& means both conditions must be true. || means at least one condition must be true.",
    "example": "public class Solution\n{\n    public static bool Allowed(bool hasTicket, bool isReady)\n    {\n        return hasTicket && isReady;\n    }\n}",
    "prediction": {
      "question": "true && false is…",
      "options": [
        "True",
        "False",
        "A string"
      ],
      "answer": 1,
      "explanation": "&& means both conditions must be true. || means at least one condition must be true."
    },
    "build": {
      "task": "Complete bool Allowed(bool hasTicket, bool isReady). && means both conditions must be true. || means at least one condition must be true.",
      "starter": "public class Solution\n{\n    public static bool Allowed(bool hasTicket, bool isReady)\n    {\n        return false;\n    }\n}",
      "solution": "public class Solution\n{\n    public static bool Allowed(bool hasTicket, bool isReady)\n    {\n        return hasTicket && isReady;\n    }\n}",
      "harness": "Console.WriteLine(Solution.Allowed(true, true));\nConsole.WriteLine(Solution.Allowed(true, false));\nConsole.WriteLine(Solution.Allowed(false, true));",
      "expected": "True\nFalse\nFalse"
    },
    "debug": "public class Solution\n{\n    public static bool Allowed(bool hasTicket, bool isReady)\n    {\n        return hasTicket || isReady;\n    }\n}",
    "apply": {
      "task": "Apply the idea independently: implement bool NeedsHelp(bool tired, bool confused).",
      "starter": "public class Solution\n{\n    public static bool NeedsHelp(bool tired, bool confused)\n    {\n        return false;\n    }\n}",
      "solution": "public class Solution\n{\n    public static bool NeedsHelp(bool tired, bool confused)\n    {\n        return tired || confused;\n    }\n}",
      "harness": "Console.WriteLine(Solution.NeedsHelp(false, false));\nConsole.WriteLine(Solution.NeedsHelp(true, false));\nConsole.WriteLine(Solution.NeedsHelp(false, true));",
      "expected": "False\nTrue\nTrue"
    }
  },
  {
    "id": "methods",
    "title": "Package the solution",
    "track": "lagos",
    "kind": "code",
    "minutes": 12,
    "concept": "A method accepts parameters, performs work and returns a value. A reusable formula works for different inputs.",
    "example": "public class Solution\n{\n    public static int Square(int number)\n    {\n        return number * number;\n    }\n}",
    "prediction": {
      "question": "Square(5) returns…",
      "options": [
        "10",
        "25",
        "5"
      ],
      "answer": 1,
      "explanation": "A method accepts parameters, performs work and returns a value. A reusable formula works for different inputs."
    },
    "build": {
      "task": "Complete int Square(int number). A method accepts parameters, performs work and returns a value. A reusable formula works for different inputs.",
      "starter": "public class Solution\n{\n    public static int Square(int number)\n    {\n        return 0;\n    }\n}",
      "solution": "public class Solution\n{\n    public static int Square(int number)\n    {\n        return number * number;\n    }\n}",
      "harness": "Console.WriteLine(Solution.Square(2));\nConsole.WriteLine(Solution.Square(5));\nConsole.WriteLine(Solution.Square(-3));",
      "expected": "4\n25\n9"
    },
    "debug": "public class Solution\n{\n    public static int Square(int number)\n    {\n        return number + number;\n    }\n}",
    "apply": {
      "task": "Apply the idea independently: implement int RectangleArea(int width, int height).",
      "starter": "public class Solution\n{\n    public static int RectangleArea(int width, int height)\n    {\n        return 0;\n    }\n}",
      "solution": "public class Solution\n{\n    public static int RectangleArea(int width, int height)\n    {\n        return width * height;\n    }\n}",
      "harness": "Console.WriteLine(Solution.RectangleArea(3, 4));\nConsole.WriteLine(Solution.RectangleArea(8, 2));\nConsole.WriteLine(Solution.RectangleArea(0, 5));",
      "expected": "12\n16\n0"
    }
  },
  {
    "id": "loops",
    "title": "One step at a time",
    "track": "lagos",
    "kind": "code",
    "minutes": 12,
    "concept": "A for loop repeats while its condition is true. Check the starting value, boundary and increment.",
    "example": "public class Solution\n{\n    public static int Sum(int limit)\n    {\n        int total = 0;\n        for (int i = 1; i <= limit; i++) total += i;\n        return total;\n    }\n}",
    "prediction": {
      "question": "Sum(3) adds 1 + 2 + 3. The result is…",
      "options": [
        "3",
        "6",
        "9"
      ],
      "answer": 1,
      "explanation": "A for loop repeats while its condition is true. Check the starting value, boundary and increment."
    },
    "build": {
      "task": "Implement Sum(limit), adding every integer from 1 through limit.",
      "starter": "public class Solution\n{\n    public static int Sum(int limit)\n    {\n        int total = 0;\n        for (int i = 1; i <= limit; i++) total += 0;\n        return total;\n    }\n}",
      "solution": "public class Solution\n{\n    public static int Sum(int limit)\n    {\n        int total = 0;\n        for (int i = 1; i <= limit; i++) total += i;\n        return total;\n    }\n}",
      "harness": "Console.WriteLine(Solution.Sum(3));\nConsole.WriteLine(Solution.Sum(5));\nConsole.WriteLine(Solution.Sum(0));",
      "expected": "6\n15\n0"
    },
    "debug": "public class Solution\n{\n    public static int Sum(int limit)\n    {\n        int total = 0;\n        for (int i = 1; i < limit; i++) total += i;\n        return total;\n    }\n}",
    "apply": {
      "task": "Implement CountEven(limit): count even numbers from 1 through limit.",
      "starter": "public class Solution\n{\n    public static int CountEven(int limit)\n    {\n        int count = 0;\n        for (int i = 1; i <= limit; i++) if (i % 2 == 0) count += 0;\n        return count;\n    }\n}",
      "solution": "public class Solution\n{\n    public static int CountEven(int limit)\n    {\n        int count = 0;\n        for (int i = 1; i <= limit; i++) if (i % 2 == 0) count++;\n        return count;\n    }\n}",
      "harness": "Console.WriteLine(Solution.CountEven(6));\nConsole.WriteLine(Solution.CountEven(5));",
      "expected": "3\n2"
    }
  },
  {
    "id": "arrays",
    "title": "A whole collection",
    "track": "lagos",
    "kind": "code",
    "minutes": 12,
    "concept": "An array holds values of one type. foreach visits each value without managing an index.",
    "example": "public class Solution\n{\n    public static int Sum(int[] values)\n    {\n        int total = 0;\n        foreach (int value in values) total += value;\n        return total;\n    }\n}",
    "prediction": {
      "question": "Sum(new int[] {2, 4, 6}) returns…",
      "options": [
        "3",
        "12",
        "246"
      ],
      "answer": 1,
      "explanation": "An array holds values of one type. foreach visits each value without managing an index."
    },
    "build": {
      "task": "Sum all values in an int array, including negative values and an empty array.",
      "starter": "public class Solution\n{\n    public static int Sum(int[] values)\n    {\n        int total = 0;\n        foreach (int value in values) total += 0;\n        return total;\n    }\n}",
      "solution": "public class Solution\n{\n    public static int Sum(int[] values)\n    {\n        int total = 0;\n        foreach (int value in values) total += value;\n        return total;\n    }\n}",
      "harness": "Console.WriteLine(Solution.Sum(new int[] {2,4,6}));\nConsole.WriteLine(Solution.Sum(new int[] {-2,3}));\nConsole.WriteLine(Solution.Sum(new int[] {}));",
      "expected": "12\n1\n0"
    },
    "debug": "public class Solution\n{\n    public static int Sum(int[] values)\n    {\n        int total = 0;\n        foreach (int value in values) total = value;\n        return total;\n    }\n}",
    "apply": {
      "task": "CountPositive(values) returns how many entries are greater than zero.",
      "starter": "public class Solution\n{\n    public static int CountPositive(int[] values)\n    {\n        int total = 0;\n        foreach (int value in values) if (value > 0) total += 0;\n        return total;\n    }\n}",
      "solution": "public class Solution\n{\n    public static int CountPositive(int[] values)\n    {\n        int total = 0;\n        foreach (int value in values) if (value > 0) total++;\n        return total;\n    }\n}",
      "harness": "Console.WriteLine(Solution.CountPositive(new int[] {-1,2,0,4}));\nConsole.WriteLine(Solution.CountPositive(new int[] {}));",
      "expected": "2\n0"
    }
  },
  {
    "id": "validation",
    "title": "Catch bad input",
    "track": "lagos",
    "kind": "code",
    "minutes": 12,
    "concept": "TryParse checks whether text can become a number without throwing an exception. Also check the allowed range.",
    "example": "public class Solution\n{\n    public static bool ValidAge(string text)\n    {\n        return int.TryParse(text, out int age) && age >= 0 && age <= 120;\n    }\n}",
    "prediction": {
      "question": "What should ValidAge(\"hello\") return?",
      "options": [
        "True",
        "False",
        "Crash"
      ],
      "answer": 1,
      "explanation": "TryParse checks whether text can become a number without throwing an exception. Also check the allowed range."
    },
    "build": {
      "task": "Complete bool ValidAge(string text). TryParse checks whether text can become a number without throwing an exception. Also check the allowed range.",
      "starter": "public class Solution\n{\n    public static bool ValidAge(string text)\n    {\n        return false;\n    }\n}",
      "solution": "public class Solution\n{\n    public static bool ValidAge(string text)\n    {\n        return int.TryParse(text, out int age) && age >= 0 && age <= 120;\n    }\n}",
      "harness": "Console.WriteLine(Solution.ValidAge(\"20\"));\nConsole.WriteLine(Solution.ValidAge(\"hello\"));\nConsole.WriteLine(Solution.ValidAge(\"-1\"));\nConsole.WriteLine(Solution.ValidAge(\"121\"));",
      "expected": "True\nFalse\nFalse\nFalse"
    },
    "debug": "public class Solution\n{\n    public static bool ValidAge(string text)\n    {\n        return int.TryParse(text, out int age);\n    }\n}",
    "apply": {
      "task": "Apply the idea independently: implement bool ValidMark(string text).",
      "starter": "public class Solution\n{\n    public static bool ValidMark(string text)\n    {\n        return false;\n    }\n}",
      "solution": "public class Solution\n{\n    public static bool ValidMark(string text)\n    {\n        return int.TryParse(text, out int mark) && mark >= 0 && mark <= 100;\n    }\n}",
      "harness": "Console.WriteLine(Solution.ValidMark(\"75\"));\nConsole.WriteLine(Solution.ValidMark(\"101\"));\nConsole.WriteLine(Solution.ValidMark(\"bad\"));\nConsole.WriteLine(Solution.ValidMark(\"0\"));",
      "expected": "True\nFalse\nFalse\nTrue"
    }
  },
  {
    "id": "student-number",
    "title": "Eight digits, exactly",
    "track": "lagos",
    "kind": "code",
    "minutes": 12,
    "concept": "Validate the entire input. A student number is text: preserve leading zeros. Check length and every character.",
    "example": "public class Solution\n{\n    public static bool ValidStudent(string number)\n    {\n        return number.Length == 8 && System.Linq.Enumerable.All(number, c => c >= '0' && c <= '9');\n    }\n}",
    "prediction": {
      "question": "Is \"00123456\" a valid 8-digit student number?",
      "options": [
        "Yes",
        "No; it starts with zero",
        "Only as an int"
      ],
      "answer": 0,
      "explanation": "Validate the entire input. A student number is text: preserve leading zeros. Check length and every character."
    },
    "build": {
      "task": "Complete bool ValidStudent(string number). Validate the entire input. A student number is text: preserve leading zeros. Check length and every character.",
      "starter": "public class Solution\n{\n    public static bool ValidStudent(string number)\n    {\n        return false;\n    }\n}",
      "solution": "public class Solution\n{\n    public static bool ValidStudent(string number)\n    {\n        return number.Length == 8 && System.Linq.Enumerable.All(number, c => c >= '0' && c <= '9');\n    }\n}",
      "harness": "Console.WriteLine(Solution.ValidStudent(\"00123456\"));\nConsole.WriteLine(Solution.ValidStudent(\"1234567\"));\nConsole.WriteLine(Solution.ValidStudent(\"1234ABCD\"));",
      "expected": "True\nFalse\nFalse"
    },
    "debug": "public class Solution\n{\n    public static bool ValidStudent(string number)\n    {\n        return number.Length == 8;\n    }\n}",
    "apply": {
      "task": "Apply the idea independently: implement bool ValidPin(string pin).",
      "starter": "public class Solution\n{\n    public static bool ValidPin(string pin)\n    {\n        return false;\n    }\n}",
      "solution": "public class Solution\n{\n    public static bool ValidPin(string pin)\n    {\n        return pin.Length == 4 && System.Linq.Enumerable.All(pin, c => c >= '0' && c <= '9');\n    }\n}",
      "harness": "Console.WriteLine(Solution.ValidPin(\"0123\"));\nConsole.WriteLine(Solution.ValidPin(\"123\"));\nConsole.WriteLine(Solution.ValidPin(\"1A23\"));",
      "expected": "True\nFalse\nFalse"
    }
  },
  {
    "id": "classes",
    "title": "Blueprint to person",
    "track": "kinshasa",
    "kind": "code",
    "minutes": 12,
    "concept": "A class is a blueprint. An object is one instance. Properties store its state; a constructor initializes it.",
    "example": "public class Student\n{\n    public string Name { get; set; }\n    public Student(string name) { Name = name; }\n}",
    "prediction": {
      "question": "new Student(\"Ada\").Name is…",
      "options": [
        "Student",
        "Ada",
        "null"
      ],
      "answer": 1,
      "explanation": "A class is a blueprint. An object is one instance. Properties store its state; a constructor initializes it."
    },
    "build": {
      "task": "Create Student with a string Name property and a constructor accepting name.",
      "starter": "public class Student\n{\n    public string Name { get; set; }\n    public Student(string name) { Name = \"\"; }\n}",
      "solution": "public class Student\n{\n    public string Name { get; set; }\n    public Student(string name) { Name = name; }\n}",
      "harness": "Console.WriteLine(new Student(\"Ada\").Name);\nConsole.WriteLine(new Student(\"Lebo\").Name);",
      "expected": "Ada\nLebo"
    },
    "debug": "public class Student\n{\n    public string Name { get; set; }\n    public Student(string name) { name = Name; }\n}",
    "apply": {
      "task": "Build Employee with Role initialized by its constructor.",
      "starter": "public class Employee\n{\n    public string Role { get; set; }\n    public Employee(string role) { Role = \"\"; }\n}",
      "solution": "public class Employee\n{\n    public string Role { get; set; }\n    public Employee(string role) { Role = role; }\n}",
      "harness": "Console.WriteLine(new Employee(\"Cashier\").Role);\nConsole.WriteLine(new Employee(\"Developer\").Role);",
      "expected": "Cashier\nDeveloper"
    }
  },
  {
    "id": "encapsulation",
    "title": "Protect the balance",
    "track": "kinshasa",
    "kind": "code",
    "minutes": 12,
    "concept": "Encapsulation keeps data and related behaviour together. Private state is changed through controlled public methods.",
    "example": "public class Account\n{\n    private int balance;\n    public int Balance => balance;\n    public void Deposit(int amount) { if (amount > 0) balance += amount; }\n}",
    "prediction": {
      "question": "Deposit(10), then Deposit(-5). Balance should be…",
      "options": [
        "5",
        "10",
        "-5"
      ],
      "answer": 1,
      "explanation": "Encapsulation keeps data and related behaviour together. Private state is changed through controlled public methods."
    },
    "build": {
      "task": "Account exposes read-only Balance. Deposit accepts only positive amounts.",
      "starter": "public class Account\n{\n    private int balance;\n    public int Balance => balance;\n    public void Deposit(int amount) { if (amount > 0) balance += 0; }\n}",
      "solution": "public class Account\n{\n    private int balance;\n    public int Balance => balance;\n    public void Deposit(int amount) { if (amount > 0) balance += amount; }\n}",
      "harness": "var a=new Account(); a.Deposit(10); a.Deposit(-5); Console.WriteLine(a.Balance); a.Deposit(7); Console.WriteLine(a.Balance);",
      "expected": "10\n17"
    },
    "debug": "public class Account\n{\n    private int balance;\n    public int Balance => balance;\n    public void Deposit(int amount) { balance += amount; }\n}",
    "apply": {
      "task": "Build Counter with read-only Value and Add(amount), ignoring zero/negative amounts.",
      "starter": "public class Counter\n{\n    private int value;\n    public int Value => value;\n    public void Add(int amount) { if (amount > 0) value += 0; }\n}",
      "solution": "public class Counter\n{\n    private int value;\n    public int Value => value;\n    public void Add(int amount) { if (amount > 0) value += amount; }\n}",
      "harness": "var c=new Counter(); c.Add(3); c.Add(-2); Console.WriteLine(c.Value); c.Add(4); Console.WriteLine(c.Value);",
      "expected": "3\n7"
    }
  },
  {
    "id": "inheritance",
    "title": "Family resemblance",
    "track": "kinshasa",
    "kind": "code",
    "minutes": 12,
    "concept": "Inheritance lets a derived class reuse accessible members of a base class. Write Derived : Base.",
    "example": "public class Person\n{\n    public string Name { get; set; } = \"\";\n}\npublic class Student : Person\n{\n    public string Course { get; set; } = \"BIT\";\n}",
    "prediction": {
      "question": "Student inherits which property from Person?",
      "options": [
        "Name",
        "Course",
        "No property"
      ],
      "answer": 0,
      "explanation": "Inheritance lets a derived class reuse accessible members of a base class. Write Derived : Base."
    },
    "build": {
      "task": "Make Student inherit Person and give Student a Course default of BIT.",
      "starter": "public class Person\n{\n    public string Name { get; set; } = \"\";\n}\npublic class Student\n{\n    public string Course { get; set; } = \"BIT\";\n}",
      "solution": "public class Person\n{\n    public string Name { get; set; } = \"\";\n}\npublic class Student : Person\n{\n    public string Course { get; set; } = \"BIT\";\n}",
      "harness": "var s=new Student {Name=\"Ada\"}; Person p=s; Console.WriteLine(p.Name); Console.WriteLine(s.Course);",
      "expected": "Ada\nBIT"
    },
    "debug": "public class Person\n{\n    public string Name { get; set; } = \"\";\n}\npublic class Student\n{\n    public string Course { get; set; } = \"BIT\";\n}",
    "apply": {
      "task": "Make Taxi inherit Vehicle and default Seats to 15.",
      "starter": "public class Vehicle\n{\n    public int Wheels { get; set; }\n}\npublic class Taxi\n{\n    public int Seats { get; set; } = 15;\n}",
      "solution": "public class Vehicle\n{\n    public int Wheels { get; set; }\n}\npublic class Taxi : Vehicle\n{\n    public int Seats { get; set; } = 15;\n}",
      "harness": "var taxi=new Taxi {Wheels=4}; Vehicle v=taxi; Console.WriteLine(v.Wheels); Console.WriteLine(taxi.Seats);",
      "expected": "4\n15"
    }
  },
  {
    "id": "polymorphism",
    "title": "Same call, new behaviour",
    "track": "kinshasa",
    "kind": "code",
    "minutes": 12,
    "concept": "Polymorphism chooses the overridden method from the actual object type. The base method must be virtual or abstract.",
    "example": "public class Student\n{\n    public virtual string GetRole() => \"Student\";\n}\npublic class BITStudent : Student\n{\n    public override string GetRole() => \"BIT Student\";\n}",
    "prediction": {
      "question": "Student s = new BITStudent(); s.GetRole() returns…",
      "options": [
        "Student",
        "BIT Student",
        "An error"
      ],
      "answer": 1,
      "explanation": "Polymorphism chooses the overridden method from the actual object type. The base method must be virtual or abstract."
    },
    "build": {
      "task": "Use virtual and override so a Student reference to BITStudent returns BIT Student.",
      "starter": "public class Student\n{\n    public virtual string GetRole() => \"Student\";\n}\npublic class BITStudent : Student\n{\n    public new string GetRole() => \"BIT Student\";\n}",
      "solution": "public class Student\n{\n    public virtual string GetRole() => \"Student\";\n}\npublic class BITStudent : Student\n{\n    public override string GetRole() => \"BIT Student\";\n}",
      "harness": "Student s=new BITStudent(); Console.WriteLine(s.GetRole()); Console.WriteLine(new Student().GetRole());",
      "expected": "BIT Student\nStudent"
    },
    "debug": "public class Student\n{\n    public string GetRole() => \"Student\";\n}\npublic class BITStudent : Student\n{\n    public override string GetRole() => \"BIT Student\";\n}",
    "apply": {
      "task": "Use Employee and PermanentEmployee so the overridden CalculatePay returns 1000m.",
      "starter": "public class Employee\n{\n    public virtual decimal CalculatePay() => 0m;\n}\npublic class PermanentEmployee : Employee\n{\n    public new decimal CalculatePay() => 1000m;\n}",
      "solution": "public class Employee\n{\n    public virtual decimal CalculatePay() => 0m;\n}\npublic class PermanentEmployee : Employee\n{\n    public override decimal CalculatePay() => 1000m;\n}",
      "harness": "Employee e=new PermanentEmployee(); Console.WriteLine(e.CalculatePay()); Console.WriteLine(new Employee().CalculatePay());",
      "expected": "1000\n0"
    }
  },
  {
    "id": "abstraction",
    "title": "Promise the essential",
    "track": "kinshasa",
    "kind": "code",
    "minutes": 12,
    "concept": "An abstract class cannot be instantiated. An abstract method has no body and derived concrete classes must implement it.",
    "example": "public abstract class Shape\n{\n    public abstract int Area();\n}\npublic class Square : Shape\n{\n    private int side;\n    public Square(int side) { this.side = side; }\n    public override int Area() => side * side;\n}",
    "prediction": {
      "question": "Can you create new Shape()?",
      "options": [
        "Yes",
        "No, Shape is abstract",
        "Only with public"
      ],
      "answer": 1,
      "explanation": "An abstract class cannot be instantiated. An abstract method has no body and derived concrete classes must implement it."
    },
    "build": {
      "task": "Complete Square.Area using side squared, keeping Shape abstract.",
      "starter": "public abstract class Shape\n{\n    public abstract int Area();\n}\npublic class Square : Shape\n{\n    private int side;\n    public Square(int side) { this.side = side; }\n    public override int Area() => 0;\n}",
      "solution": "public abstract class Shape\n{\n    public abstract int Area();\n}\npublic class Square : Shape\n{\n    private int side;\n    public Square(int side) { this.side = side; }\n    public override int Area() => side * side;\n}",
      "harness": "Shape a=new Square(3); Console.WriteLine(a.Area()); Console.WriteLine(new Square(5).Area());",
      "expected": "9\n25"
    },
    "debug": "public abstract class Shape\n{\n    public abstract int Area();\n}\npublic class Square : Shape\n{\n    private int side;\n    public Square(int side) { this.side = side; }\n    public int Area() => side * side;\n}",
    "apply": {
      "task": "Build HourlyWorker : Worker. Pay is hours multiplied by 50.",
      "starter": "public abstract class Worker\n{\n    public abstract int Pay();\n}\npublic class HourlyWorker : Worker\n{\n    private int hours;\n    public HourlyWorker(int hours) { this.hours = hours; }\n    public override int Pay() => 0;\n}",
      "solution": "public abstract class Worker\n{\n    public abstract int Pay();\n}\npublic class HourlyWorker : Worker\n{\n    private int hours;\n    public HourlyWorker(int hours) { this.hours = hours; }\n    public override int Pay() => hours * 50;\n}",
      "harness": "Worker w=new HourlyWorker(4); Console.WriteLine(w.Pay()); Console.WriteLine(new HourlyWorker(0).Pay());",
      "expected": "200\n0"
    }
  },
  {
    "id": "interfaces",
    "title": "Keep your contract",
    "track": "kinshasa",
    "kind": "code",
    "minutes": 12,
    "concept": "An interface defines a contract. A class that implements it must provide its required public members.",
    "example": "public interface IPrintable\n{\n    string Print();\n}\npublic class Receipt : IPrintable\n{\n    public string Print() => \"Paid\";\n}",
    "prediction": {
      "question": "What must Receipt implement from IPrintable?",
      "options": [
        "Print()",
        "Receipt()",
        "Name"
      ],
      "answer": 0,
      "explanation": "An interface defines a contract. A class that implements it must provide its required public members."
    },
    "build": {
      "task": "Implement IPrintable.Print in Receipt to return Paid.",
      "starter": "public interface IPrintable\n{\n    string Print();\n}\npublic class Receipt : IPrintable\n{\n    public string Print() => \"\";\n}",
      "solution": "public interface IPrintable\n{\n    string Print();\n}\npublic class Receipt : IPrintable\n{\n    public string Print() => \"Paid\";\n}",
      "harness": "IPrintable p=new Receipt(); Console.WriteLine(p.Print());",
      "expected": "Paid"
    },
    "debug": "public interface IPrintable\n{\n    string Print();\n}\npublic class Receipt : IPrintable\n{\n    private string Print() => \"Paid\";\n}",
    "apply": {
      "task": "EmailNotice implements INotifier.Send and returns Sent.",
      "starter": "public interface INotifier\n{\n    string Send();\n}\npublic class EmailNotice : INotifier\n{\n    public string Send() => \"\";\n}",
      "solution": "public interface INotifier\n{\n    string Send();\n}\npublic class EmailNotice : INotifier\n{\n    public string Send() => \"Sent\";\n}",
      "harness": "INotifier n=new EmailNotice(); Console.WriteLine(n.Send());",
      "expected": "Sent"
    }
  },
  {
    "id": "controls",
    "title": "Build a useful form",
    "track": "jozi",
    "kind": "quiz",
    "minutes": 8,
    "concept": "Choose controls by the job they do. TextBox accepts text, Label describes it, and Button triggers an action.",
    "example": "Choose controls by the job they do. TextBox accepts text, Label describes it, and Button triggers an action.",
    "questions": [
      {
        "question": "Which control accepts a student name?",
        "options": [
          "Label",
          "TextBox",
          "Button"
        ],
        "answer": 1,
        "explanation": "TextBox accepts user input."
      },
      {
        "question": "Which property changes button wording?",
        "options": [
          "Name",
          "Text",
          "Size"
        ],
        "answer": 1,
        "explanation": "Text is visible wording. Name is the identifier in code."
      },
      {
        "question": "Which control triggers submission?",
        "options": [
          "Button",
          "Label",
          "ListBox"
        ],
        "answer": 0,
        "explanation": "A Button Click event triggers your handler."
      },
      {
        "question": "Which property describes a control for assistive technology?",
        "options": [
          "BackColor",
          "AccessibleName",
          "X"
        ],
        "answer": 1,
        "explanation": "AccessibleName gives a meaningful name to assistive technology."
      }
    ]
  },
  {
    "id": "events",
    "title": "A click starts a story",
    "track": "jozi",
    "kind": "quiz",
    "minutes": 8,
    "concept": "An event announces something happened. Attach a handler to run code in response.",
    "example": "An event announces something happened. Attach a handler to run code in response.",
    "questions": [
      {
        "question": "When should validation run before submitting a form?",
        "options": [
          "On the Submit Click event",
          "Only at design time",
          "Never"
        ],
        "answer": 0,
        "explanation": "Validate inside the submission handler before processing data."
      },
      {
        "question": "What is btnSave_Click?",
        "options": [
          "An event handler method",
          "A color",
          "A form size"
        ],
        "answer": 0,
        "explanation": "It is a method wired to btnSave.Click."
      },
      {
        "question": "Which event responds to text changes?",
        "options": [
          "Load",
          "Click",
          "TextChanged"
        ],
        "answer": 2,
        "explanation": "TextChanged fires when the text changes."
      },
      {
        "question": "Which statement adds an item?",
        "options": [
          "list.Items.Add(\"Ada\");",
          "list.Text.Clear();",
          "list.Name = \"Ada\";"
        ],
        "answer": 0,
        "explanation": "Items.Add inserts an entry into the collection."
      }
    ]
  },
  {
    "id": "choices",
    "title": "One choice or many?",
    "track": "jozi",
    "kind": "quiz",
    "minutes": 8,
    "concept": "RadioButtons select one option in a group. CheckBoxes represent independent choices. ComboBox uses a compact list.",
    "example": "RadioButtons select one option in a group. CheckBoxes represent independent choices. ComboBox uses a compact list.",
    "questions": [
      {
        "question": "Which control represents multiple optional interests?",
        "options": [
          "RadioButton",
          "CheckBox",
          "Label"
        ],
        "answer": 1,
        "explanation": "CheckBoxes can be selected independently."
      },
      {
        "question": "Which control is a compact dropdown?",
        "options": [
          "ComboBox",
          "TextBox",
          "Button"
        ],
        "answer": 0,
        "explanation": "ComboBox provides a dropdown selection."
      },
      {
        "question": "Which property reads a CheckBox selection?",
        "options": [
          "Checked",
          "Text",
          "Height"
        ],
        "answer": 0,
        "explanation": "Checked is a boolean selection state."
      },
      {
        "question": "Which control limits numeric input?",
        "options": [
          "Label",
          "NumericUpDown",
          "ListBox"
        ],
        "answer": 1,
        "explanation": "NumericUpDown can constrain input with Minimum and Maximum."
      }
    ]
  },
  {
    "id": "collections-ui",
    "title": "Manage the guest list",
    "track": "jozi",
    "kind": "quiz",
    "minutes": 8,
    "concept": "ListBox stores entries in Items. Add inserts, Remove deletes a matching item, and Clear removes all entries.",
    "example": "ListBox stores entries in Items. Add inserts, Remove deletes a matching item, and Clear removes all entries.",
    "questions": [
      {
        "question": "Remove every item from lstNames with…",
        "options": [
          "lstNames.Items.Clear();",
          "lstNames.ClearAll();",
          "lstNames.Text = \"\";"
        ],
        "answer": 0,
        "explanation": "Items.Clear removes the entire collection."
      },
      {
        "question": "Read the selected entry with…",
        "options": [
          "SelectedItem",
          "Name",
          "BackColor"
        ],
        "answer": 0,
        "explanation": "SelectedItem returns the selected object; check for null."
      },
      {
        "question": "Why check SelectedItem for null?",
        "options": [
          "No item may be selected",
          "All items are integers",
          "To change the color"
        ],
        "answer": 0,
        "explanation": "A user may press Remove without selecting an entry."
      },
      {
        "question": "Remove the selected entry with…",
        "options": [
          "Items.Remove(SelectedItem)",
          "Items.Add(SelectedItem)",
          "Text = SelectedItem"
        ],
        "answer": 0,
        "explanation": "Items.Remove deletes the selected object."
      }
    ]
  },
  {
    "id": "layout",
    "title": "Design for every screen",
    "track": "jozi",
    "kind": "quiz",
    "minutes": 8,
    "concept": "Location sets coordinates. Size sets width/height. Anchor preserves edge distances; Dock attaches controls to an edge or fills space.",
    "example": "Location sets coordinates. Size sets width/height. Anchor preserves edge distances; Dock attaches controls to an edge or fills space.",
    "questions": [
      {
        "question": "Which property attaches a control to an edge?",
        "options": [
          "Name",
          "Dock",
          "Text"
        ],
        "answer": 1,
        "explanation": "Dock controls edge attachment or Fill."
      },
      {
        "question": "What keeps a button the same distance from the bottom-right edges?",
        "options": [
          "Anchor Bottom, Right",
          "Dock Fill",
          "TabIndex 0"
        ],
        "answer": 0,
        "explanation": "Bottom/Right anchoring preserves those edge distances."
      },
      {
        "question": "What controls keyboard focus order?",
        "options": [
          "TabIndex",
          "BackColor",
          "Height"
        ],
        "answer": 0,
        "explanation": "TabIndex sets tab navigation order."
      },
      {
        "question": "A hidden control has…",
        "options": [
          "Visible = false",
          "Enabled = false",
          "Name = \"\""
        ],
        "answer": 0,
        "explanation": "Visible controls whether it is shown. Enabled controls interaction."
      }
    ]
  },
  {
    "id": "forms-validation",
    "title": "Make mistakes recoverable",
    "track": "jozi",
    "kind": "quiz",
    "minutes": 8,
    "concept": "Validate required fields, parse numbers safely, and show a useful message. Preserve user input so they can correct it.",
    "example": "Validate required fields, parse numbers safely, and show a useful message. Preserve user input so they can correct it.",
    "questions": [
      {
        "question": "How should an empty name be handled?",
        "options": [
          "Show a clear error and keep the form open",
          "Crash",
          "Save anyway"
        ],
        "answer": 0,
        "explanation": "Give actionable feedback and preserve entered values."
      },
      {
        "question": "How do you show/hide a password in WinForms?",
        "options": [
          "UseSystemPasswordChar",
          "TabIndex",
          "Location"
        ],
        "answer": 0,
        "explanation": "UseSystemPasswordChar toggles masking."
      },
      {
        "question": "What confirms an exit?",
        "options": [
          "MessageBox with YesNo",
          "Clear the form",
          "A new Label"
        ],
        "answer": 0,
        "explanation": "MessageBoxButtons.YesNo lets the user choose."
      },
      {
        "question": "What is a good validation message?",
        "options": [
          "Invalid",
          "Enter exactly 8 digits for the student number",
          "Error 500"
        ],
        "answer": 1,
        "explanation": "Explain how the learner can correct the field."
      }
    ]
  }
];

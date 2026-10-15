const record = (id, name, code, type, days, accessories, status = "Booked") =>
  `${id}|${name}|${code}|${type}|${days}|${accessories}|${status}`;
export const equipmentRecovery = [
  "Back up the original project and any historical data before changing it.",
  "Retarget the supplied .NET Framework 4.7.2 project to the paper’s requested 4.8 when working in Visual Studio.",
  "Repair compilation and startup first, then reconnect Form Load, Add Booking and Load Bookings events.",
  "Keep the EquipmentBooking class, seven corresponding fields/properties, six-argument constructor, CompleteBooking method and List<EquipmentBooking>.",
  "Locate the real bookings.txt before claiming historical recovery. It was not included anywhere in the supplied practice ZIP; the paper’s sample rows are examples, not recovered evidence.",
  "Use a stable runtime data path, copy the recovered file to output, load automatically on startup, ignore blanks and summarize invalid records once.",
  "Test the class, loading, capture validation and statistics in that order. Confirm old saved statuses survive, Completed equipment can be booked again, and invalid capture adds nothing.",
  "Build, reopen and test the Windows form in Visual Studio. Browser checks below cover the logic model, not native event wiring or runtime disk recovery.",
];
export function equipmentMission(variant = 0) {
  const max = [7, 14, 3][variant],
    prefix = ["EQ-", "DEV-", "KIT-"][variant],
    code = prefix + "L014",
    other = prefix + "C041";
  const sample = record(
    "225104321",
    "Ayanda Mthembu",
    code,
    "Laptop",
    Math.min(5, max),
    "True",
  );
  const completed = record(
    "225104325",
    "Naledi Radebe",
    other,
    "Camera",
    2,
    "True",
    "Completed",
  );
  const classCode = `class EquipmentBooking
{
    private string studentNumber, studentName, equipmentNumber, equipmentType, bookingStatus;
    private int bookingDays;
    private bool accessoriesRequired;
    public string StudentNumber { get { return studentNumber; } set { studentNumber = value; } }
    public string StudentName { get { return studentName; } set { studentName = value; } }
    public string EquipmentNumber { get { return equipmentNumber; } set { equipmentNumber = value; } }
    public string EquipmentType { get { return equipmentType; } set { equipmentType = value; } }
    public int BookingDays { get { return bookingDays; } set { bookingDays = value; } }
    public bool AccessoriesRequired { get { return accessoriesRequired; } set { accessoriesRequired = value; } }
    public string BookingStatus { get { return bookingStatus; } set { bookingStatus = value; } }
    public EquipmentBooking(string studentNumber, string studentName, string equipmentNumber, string equipmentType, int bookingDays, bool accessoriesRequired)
    {
        this.studentNumber = studentNumber;
        this.studentName = studentName;
        this.equipmentNumber = equipmentNumber;
        this.equipmentType = equipmentType;
        this.bookingDays = bookingDays;
        this.accessoriesRequired = accessoriesRequired;
        bookingStatus = "Booked";
    }
    public void CompleteBooking() { bookingStatus = "Completed"; }
}
`;
  const solution = `using System;
using System.Collections.Generic;
using System.Linq;
var bookings = new List<EquipmentBooking>();
int skipped = 0;
string command;
while ((command = Console.ReadLine()) != null)
{
    if (command == "STATS")
    {
        int booked = bookings.Count(b => b.BookingStatus == "Booked");
        Console.WriteLine(bookings.Count + "|" + booked + "|" + (bookings.Count - booked));
        continue;
    }
    if (command == "LIST")
    {
        foreach (var b in bookings) Console.WriteLine(b.StudentNumber+"|"+b.StudentName+"|"+b.EquipmentNumber+"|"+b.EquipmentType+"|"+b.BookingDays+"|"+b.AccessoriesRequired+"|"+b.BookingStatus);
        continue;
    }
    if (command == "SKIPPED") { Console.WriteLine(skipped); continue; }
    if (command.StartsWith("COMPLETE "))
    {
        var existing = bookings.FirstOrDefault(b => b.EquipmentNumber == command.Substring(9).Trim().ToUpperInvariant() && b.BookingStatus == "Booked");
        if (existing != null) existing.CompleteBooking();
        continue;
    }
    if (command.StartsWith("PROPERTY ") && bookings.Count > 0)
    {
        bookings[0].EquipmentNumber = command.Substring(9);
        Console.WriteLine(bookings[0].EquipmentNumber);
        continue;
    }
    bool load = command.StartsWith("LOAD ");
    if (!load && !command.StartsWith("ADD ")) continue;
    string line = command.Substring(load ? 5 : 4);
    if (load && string.IsNullOrWhiteSpace(line)) continue;
    string[] f = line.Split('|');
    int days = 0; bool accessories = false;
    bool valid = f.Length == (load ? 7 : 6);
    if (valid)
    {
        f[1] = f[1].Trim(); f[2] = f[2].Trim().ToUpperInvariant();
        valid = f[0].Length == 9 && f[0].All(c => c >= '0' && c <= '9') &&
            f[1].Length >= 3 && f[2].StartsWith("${prefix}") && f[2].Length >= ${prefix.length + 3} &&
            new[]{"Laptop","Projector","Camera","Tablet"}.Contains(f[3]) &&
            int.TryParse(f[4], out days) && days >= 1 && days <= ${max} &&
            bool.TryParse(f[5], out accessories) && (!load || f[6] == "Booked" || f[6] == "Completed");
    }
    // @trace load, valid, days
    if (!valid) { if(load) skipped++; else Console.WriteLine("Rejected"); continue; }
    if (!load && bookings.Any(b => b.EquipmentNumber == f[2] && b.BookingStatus == "Booked")) { Console.WriteLine("Rejected"); continue; }
    var booking = new EquipmentBooking(f[0],f[1],f[2],f[3],days,accessories);
    if (load) booking.BookingStatus = f[6];
    bookings.Add(booking);
    if (!load) Console.WriteLine("Added");
}
${classCode}`;
  const starter = solution
    .replace(
      "this.equipmentType = equipmentType;",
      "this.equipmentType = EquipmentType;",
    )
    .replace(
      "set { equipmentNumber = value; }",
      'set { equipmentNumber = ""; }',
    )
    .replace('bookingStatus = "Completed";', 'bookingStatus = "Booked";')
    .replace("bookings.Count - booked", "booked - bookings.Count")
    .replace("f[1].Length >= 3 &&", "f[1].Length >= 1 &&")
    .replace(`days <= ${max}`, `days < ${max}`)
    .replace(
      "if (load) booking.BookingStatus = f[6];",
      "// TODO: restore the saved status",
    );
  const add = sample.split("|").slice(0, 6).join("|");
  return {
    id: ["equipment-booking", "device-loans", "kit-hire"][variant],
    title: [
      "Practice Question 15 OCT: Equipment Booking",
      "Similar project: campus device loans",
      "Similar project: short kit hire",
    ][variant],
    category: variant ? "Project variation" : "Your practice question",
    brief: `Repair the complete booking logic model. ${variant ? "Original variation." : "Based on your supplied practice question."} Student Number: exactly 9 ASCII digits. Name: trimmed, 3+ characters. Equipment: uppercase ${prefix}, at least ${prefix.length + 3} characters. Types: Laptop, Projector, Camera, Tablet. Days: 1–${max} inclusive. Reject pipe characters in name/code via the fixed field count. Active duplicates are forbidden; Completed records do not block capture. LOAD takes 7 fields and preserves status; ADD takes 6 fields and starts Booked. STATS prints total|booked|completed. LIST prints all 7 fields. COMPLETE code updates an existing booking. PROPERTY code tests the first object’s setter. SKIPPED prints invalid load count. Missing input represents an empty usable store. Enter one command per line. Disk access and WinForms event wiring must be tested in the Windows project.`,
    starter,
    solution,
    hint: "Start with construction and properties. Compare loaded and new statuses. Test both boundaries, duplicate active equipment and count = total − completed. The native project also needs its event connections and recovered data file.",
    cases: [
      [`LOAD ${sample}\nLOAD ${completed}\nSTATS`, "2|1|1"],
      [`ADD ${add}\nLIST`, "Added\n" + sample],
      [`ADD ${add}\nADD ${add}\nSTATS`, "Added\nRejected\n1|1|0"],
      [`LOAD ${sample}\nCOMPLETE ${code}\nADD ${add}\nSTATS`, "Added\n2|1|1"],
      [`LOAD ${sample}\nPROPERTY ${other}`, other],
      [
        `ADD ${record(
          "225104321",
          " Ayo ",
          " " + code.toLowerCase() + " ",
          "Laptop",
          max,
          "False",
        )
          .split("|")
          .slice(0, 6)
          .join("|")}\nSTATS`,
        "Added\n1|1|0",
      ],
      [
        `ADD ${record("225104321", "Ayo", code, "Laptop", max + 1, "True")
          .split("|")
          .slice(0, 6)
          .join("|")}`,
        "Rejected",
      ],
      [`LOAD bad\nLOAD \nLOAD ${completed}\nSKIPPED\nSTATS`, "1\n1|0|1"],
      ["", ""],
      ...[
        ["22510432", "Ayo", code, "Laptop", 1, "True"],
        ["１２５１０４３２１", "Ayo", code, "Laptop", 1, "True"],
        ["225104321", "Al", code, "Laptop", 1, "True"],
        ["225104321", "Ayo", code, "Phone", 1, "True"],
        ["225104321", "Ayo", code, "Laptop", 0, "True"],
        ["225104321", "Ayo", code, "Laptop", 1, "maybe"],
        ["225104321", "A|yo", code, "Laptop", 1, "True"],
      ].map((f) => ["ADD " + f.join("|"), "Rejected"]),
    ],
  };
}

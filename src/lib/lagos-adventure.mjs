// Adventure state uses existing Progress.steps/drafts, so account isolation,
// device backups and cloud snapshots retain it without a schema migration.
export const adventureKey = "lagos-adventure";
export const adventureDraftKey = (id) => "lagos-mission-" + id;

export const lagosMissions = [
  {
    id: "streetlights",
    title: "Restore the Streetlights",
    brief:
      "Rookie Street has gone dark. Each working lamp needs 3 power cells. Return the cells needed for the requested number of lamps. Zero or negative lamps need zero cells.",
    signature: "public static int Lights(int lamps)",
    starter:
      "public static int Lights(int lamps)\n{\n    if (lamps <= 0) return 0;\n    return lamps + 3; // Repair the power calculation\n}",
    solution:
      "public static int Lights(int lamps) { return lamps <= 0 ? 0 : lamps * 3; }",
    cases: [
      ["Lights(4)", "12"],
      ["Lights(1)", "3"],
      ["Lights(0)", "0"],
      ["Lights(-2)", "0"],
      ["Lights(7)", "21"],
    ],
    hints: [
      "Trace the starter with 4 lamps: adding 3 gives 7. Does that power all four lamps?",
      "Every lamp needs the same 3 cells. Use multiplication to scale the number of cells.",
    ],
    achievement: "Light Keeper",
    xp: 40,
    lessonId: "variables",
    intro:
      "I’m TOR. Let’s bring Rookie Street back to life, one real program at a time. Repair the calculation, then run the streetlight tests. Experiments never cost XP here.",
    success:
      "The streetlights are on! You used a calculation to restore the neighbourhood. The digital shop can now power up.",
  },
  {
    id: "digital-shop",
    title: "Repair the Digital Shop",
    brief:
      "Help Amina reopen her shop. A sale is allowed only when stock is greater than zero AND the customer has at least 5 coins. Return true for an allowed sale, otherwise false.",
    signature: "public static bool ShopOpen(int stock, int coins)",
    starter:
      "public static bool ShopOpen(int stock, int coins)\n{\n    bool hasStock = stock > 0;\n    bool canPay = coins >= 5;\n    return hasStock || canPay; // Repair the shop's rule\n}",
    solution:
      "public static bool ShopOpen(int stock, int coins) { return stock > 0 && coins >= 5; }",
    cases: [
      ["ShopOpen(2, 5)", "true"],
      ["ShopOpen(1, 9)", "true"],
      ["ShopOpen(0, 10)", "false"],
      ["ShopOpen(3, 4)", "false"],
      ["ShopOpen(-1, 5)", "false"],
      ["ShopOpen(0, 0)", "false"],
    ],
    hints: [
      "Try an empty shelf with 10 coins. The shop must reject the sale even though the customer can pay.",
      "Both rules must be true. C# uses && for AND and || for OR. Keep the 5-coin boundary inclusive.",
    ],
    achievement: "Market Maker",
    xp: 60,
    lessonId: "conditions",
    intro:
      "Amina has power again, but her till is accepting impossible sales. Read both conditions. Can money alone make an empty shelf sell something?",
    success:
      "The shop is open! Your conditions protect both the stock and the customer's coins. One last repair: the community network.",
  },
  {
    id: "network",
    title: "Rescue the Network",
    brief:
      "Chapter boss: count delivered signals. Each positive number in the array represents one delivered signal; zero and negative numbers are noise. Return the number of positive entries, not their sum. An empty array returns zero.",
    signature: "public static int Delivered(int[] signals)",
    starter:
      "public static int Delivered(int[] signals)\n{\n    int delivered = 0;\n    foreach (int signal in signals)\n    {\n        if (signal >= 0) delivered += signal; // Repair the filter and counter\n    }\n    return delivered;\n}",
    solution:
      "public static int Delivered(int[] signals) { int delivered = 0; foreach (int signal in signals) if (signal > 0) delivered++; return delivered; }",
    cases: [
      ["Delivered(new int[] { 2, -1, 4, 0 })", "2"],
      ["Delivered(new int[] {})", "0"],
      ["Delivered(new int[] { -4, -1, 0 })", "0"],
      ["Delivered(new int[] { 1, 1, 1 })", "3"],
      ["Delivered(new int[] { 9 })", "1"],
    ],
    hints: [
      "Trace [2, -1, 4, 0]. Two entries are positive, so the answer is 2, not 6.",
      "Use signal > 0 to filter the noise. Add one to delivered for each accepted entry, instead of adding signal.",
    ],
    achievement: "Rookie Street Guardian",
    xp: 100,
    lessonId: "loops",
    intro:
      "Final repair, partner. A loop visits every signal. Check what the condition accepts, then what the counter adds. We need a count, not a sum.",
    success:
      "Network restored. Lagos is connected! You earned Rookie Street Guardian by repairing calculations, conditions and a loop. Your whole street is alive again.",
  },
];

/** Only a contiguous prefix of known missions counts toward chapter progress. */
export function completedMissions(steps) {
  const saved = new Set(
    Array.isArray(steps?.[adventureKey]) ? steps[adventureKey] : [],
  );
  const firstMissing = lagosMissions.findIndex(
    (mission) => !saved.has(mission.id),
  );
  return lagosMissions.slice(
    0,
    firstMissing < 0 ? lagosMissions.length : firstMissing,
  );
}

export function unlockedMission(steps, id) {
  const index = lagosMissions.findIndex((mission) => mission.id === id);
  return index >= 0 && index <= completedMissions(steps).length;
}

export function adventureXp(steps) {
  return completedMissions(steps).reduce((sum, mission) => sum + mission.xp, 0);
}

/** Called only with rows from the current real compiler run, never editor text. */
export function awardMission(progress, id, rows, day) {
  const mission = lagosMissions.find((item) => item.id === id);
  if (
    !mission ||
    !unlockedMission(progress.steps, id) ||
    completedMissions(progress.steps).some((item) => item.id === id) ||
    !Array.isArray(rows) ||
    rows.length !== mission.cases.length ||
    !mission.cases.every((_, index) => rows[index]?.passed === true) ||
    typeof day !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(day)
  )
    return progress;
  return {
    ...progress,
    steps: {
      ...progress.steps,
      [adventureKey]: [
        ...completedMissions(progress.steps).map((item) => item.id),
        id,
      ],
    },
    activity: [...new Set([...progress.activity, day])].slice(-365),
  };
}

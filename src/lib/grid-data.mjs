export function gridColumns(text = "") {
  return String(text)
    .split("\n")
    .filter(Boolean)
    .map((line, i) => {
      const [name, ...header] = line.split("|");
      return {
        name: name.trim() || `Column${i + 1}`,
        header: header.length ? header.join("|") : name,
      };
    });
}
export function gridRows(text = "[]") {
  try {
    const rows = JSON.parse(text || "[]");
    if (
      !Array.isArray(rows) ||
      rows.length > 100 ||
      rows.some(
        (row) =>
          !Array.isArray(row) ||
          row.length > 16 ||
          row.some(
            (cell) =>
              !["string", "number", "boolean"].includes(typeof cell) ||
              String(cell).length > 500,
          ),
      )
    )
      return [];
    return rows.map((row) => row.map(String));
  } catch {
    return [];
  }
}

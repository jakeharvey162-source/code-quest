import { toolbox } from "../designer-engine.mjs";
export type Control = {
  id: string;
  type: string;
  name: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parentId?: string;
  font: string;
  foreColor: string;
  backColor: string;
  enabled: boolean;
  visible: boolean;
  tabIndex: number;
  anchor: string;
  dock: string;
  accessibleName: string;
  eventValueChanged: string;
  eventClick: string;
  eventTextChanged: string;
  eventSelectedIndexChanged: string;
  eventCheckedChanged: string;
  items: string;
  checked: boolean;
  password: boolean;
  minimum: number;
  maximum: number;
  value: number;
  selectedIndex?: number;
  columns: string;
  gridRows: string;
  readOnly: boolean;
  multiline: boolean;
  mask?: string;
  eventSelectionChanged: string;
};
export function validControls(value: unknown): value is Control[] {
  return (
    Array.isArray(value) &&
    value.length <= 100 &&
    value.every(
      (c) =>
        c &&
        toolbox.includes(c.type) &&
        (c.mask === undefined ||
          (typeof c.mask === "string" && c.mask.length <= 64)) &&
        (c.parentId === undefined ||
          (typeof c.parentId === "string" && c.parentId.length < 100)) &&
        [
          "id",
          "name",
          "text",
          "font",
          "foreColor",
          "backColor",
          "anchor",
          "dock",
          "accessibleName",
          "eventValueChanged",
          "eventClick",
          "eventTextChanged",
          "eventSelectedIndexChanged",
          "eventCheckedChanged",
          "items",
          "columns",
          "eventSelectionChanged",
        ].every((k) => typeof c[k] === "string" && c[k].length < 10000) &&
        typeof c.gridRows === "string" &&
        c.gridRows.length <= 850000 &&
        [
          "x",
          "y",
          "width",
          "height",
          "tabIndex",
          "minimum",
          "maximum",
          "value",
        ].every((k) => Number.isFinite(c[k])) &&
        ["x", "y", "width", "height", "tabIndex"].every(
          (k) => Number.isSafeInteger(c[k]) && c[k] >= 0 && c[k] <= 10000,
        ) &&
        c.width >= 24 &&
        c.height >= 20 &&
        [
          "enabled",
          "visible",
          "checked",
          "password",
          "readOnly",
          "multiline",
        ].every((k) => typeof c[k] === "boolean") &&
        /^#[0-9a-f]{6}$/i.test(c.foreColor) &&
        /^#[0-9a-f]{6}$/i.test(c.backColor) &&
        ["None", "Top", "Bottom", "Left", "Right", "Fill"].includes(c.dock) &&
        c.anchor
          .split(",")
          .every((s: string) =>
            ["Top", "Bottom", "Left", "Right"].includes(s.trim()),
          ),
    ) &&
    new Set(value.map((c) => c.id)).size === value.length
  );
}
export function normalizeControls(value: unknown): Control[] | null {
  if (!Array.isArray(value)) return null;
  const migrated = value.map((c) =>
    c && typeof c === "object"
      ? {
          eventValueChanged: "",
          parentId: "",
          columns: "Column1|Column 1\nColumn2|Column 2",
          gridRows: "[]",
          readOnly: true,
          multiline: false,
          mask: "",
          eventSelectionChanged: "",
          eventSelectedIndexChanged: "",
          eventCheckedChanged: "",
          ...c,
        }
      : c,
  );
  return validControls(migrated) ? migrated : null;
}

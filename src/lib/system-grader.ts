import { formEventSource, parseFormOutput } from "./form-runtime.mjs";
import { gridRows } from "./grid-data.mjs";
import { gradeSystemDesign } from "./system-projects.mjs";
import { runCSharp } from "./compiler";
import type { Control } from "../components/FormDesigner";
export async function gradeSystem(
  project: any,
  controls: Control[],
  code: string,
  onStatus: (text: string) => void,
  signal: AbortSignal,
) {
  const design = gradeSystemDesign(project, controls, code);
  let state = controls.map((c) => ({ ...c })),
    fields = {};
  const results = [];
  for (const scenario of project.tests) {
    if (signal.aborted)
      throw new Error("System checks stopped. Your work is saved.");
    onStatus(`Testing: ${scenario.name}`);
    try {
      for (const [name, value] of Object.entries(scenario.input)) {
        const c = state.find((c) => c.name === name);
        if (!c)
          throw new Error(
            `Missing ${name}. Use the names in this project's starter form.`,
          );
        if (c.type === "DataGridView") c.selectedIndex = Number(value);
        else if (c.type === "NumericUpDown") c.value = Number(value);
        else c.text = String(value);
      }
      const button = state.find((c) => c.name === scenario.click);
      if (!button?.eventClick)
        throw new Error(`Wire the ${scenario.click} Click event.`);
      const run = await runCSharp(
        formEventSource(state, code, button.eventClick, button.id, fields),
      );
      if (signal.aborted) throw new Error("Checks stopped.");
      if (!run.success)
        throw new Error(
          run.diagnostics.map((d) => `${d.id}: ${d.message}`).join("\n"),
        );
      const next = parseFormOutput(run.stdOut || "", state);
      state = next.controls;
      fields = next.fields;
      const expected = scenario.expect,
        problems = [];
      if (
        expected.label &&
        state.find((c) => c.name === expected.label)?.text !== expected.text
      )
        problems.push(
          `Expected ${expected.label}.Text: ${expected.text}; got ${state.find((c) => c.name === expected.label)?.text || "empty"}.`,
        );
      if (
        expected.grid &&
        gridRows(state.find((c) => c.name === expected.grid)?.gridRows)
          .length !== expected.rows
      )
        problems.push(
          `Expected ${expected.rows} rows in ${expected.grid}; got ${gridRows(state.find((c) => c.name === expected.grid)?.gridRows).length}.`,
        );
      if (
        expected.lastRow &&
        JSON.stringify(
          gridRows(state.find((c) => c.name === expected.grid)?.gridRows).at(
            -1,
          ),
        ) !== JSON.stringify(expected.lastRow)
      )
        problems.push(
          `Expected the last grid row to contain ${expected.lastRow.join(", ")}.`,
        );
      if (expected.message && !next.messages.length)
        problems.push(
          "Show a MessageBox explaining why the input was rejected.",
        );
      results.push({
        name: scenario.name,
        passed: !problems.length,
        detail:
          problems.join(" ") || "Expected behaviour verified with real C#.",
      });
    } catch (error) {
      results.push({
        name: scenario.name,
        passed: false,
        detail: error instanceof Error ? error.message : "This case failed.",
      });
    }
  }
  if (signal.aborted)
    throw new Error("System checks stopped. Your work is saved.");
  const behavior = Math.round(
    (50 * results.filter((r) => r.passed).length) / results.length,
  );
  return { total: design.earned + behavior, design, behavior, results };
}

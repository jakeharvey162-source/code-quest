import test from "node:test";
import assert from "node:assert/strict";
import {
  systemProjects,
  gradeSystemDesign,
} from "../src/lib/system-projects.mjs";
import {
  validateForm,
  designerCode,
  addControl,
} from "../src/designer-engine.mjs";
import { projectZip } from "../src/lib/project-export.mjs";
import { unzipSync, strFromU8 } from "fflate";
for (const project of systemProjects) {
  test(`${project.title}: valid form and genuine partial credit`, () => {
    assert.deepEqual(validateForm(project.template).issues, []);
    assert.equal(
      gradeSystemDesign(project, project.template, project.solution).earned,
      50,
    );
    assert.equal(
      gradeSystemDesign(project, project.template, project.starter).earned,
      30,
    );
    assert.equal(
      gradeSystemDesign(
        project,
        project.template,
        "// decimal.TryParse(x); if(x) return; dgv.Rows.Add(1);",
      ).earned,
      20,
    );
    const files = unzipSync(
      projectZip(project.template, { handlerCode: project.solution }),
    );
    const designer = Object.entries(files).find(([name]) =>
      name.endsWith("Form1.Designer.cs"),
    );
    assert.match(
      strFromU8(designer[1]),
      /new System\.Windows\.Forms\.DataGridView\(\)/,
    );
    assert.match(strFromU8(designer[1]), /\.Columns.Add\(/);
  });
}
test("malformed grid rows and fractional ProgressBar values produce validation feedback", () => {
  const grid = addControl([], "DataGridView");
  grid[0].gridRows = "[null]";
  assert.equal(validateForm(grid).ok, false);
  grid[0].gridRows = '[["wrong column count"]]';
  assert.equal(validateForm(grid).ok, false);
  const progress = addControl([], "ProgressBar");
  progress[0].value = 1.5;
  assert.match(validateForm(progress).issues.join(" "), /integers/);
  progress[0].value = 10;
  assert.equal(validateForm(progress).ok, true);
  assert.match(designerCode(progress), /\.Value = 10;/);
});

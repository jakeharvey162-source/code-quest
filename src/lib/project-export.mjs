import { reviewSource } from "./assessment-engine.mjs";
import { zipSync, strToU8 } from "fflate";
import { designerCode, validateForm } from "../designer-engine.mjs";
export function projectFiles(controls, { handlerCode = "" } = {}) {
  const validation = validateForm(controls);
  if (!validation.ok) throw new Error(validation.issues.join("\n"));
  const fields = controls
    .map((c) => `        private System.Windows.Forms.${c.type} ${c.name};`)
    .join("\n");
  const declared = new Set(
    [
      ...reviewSource(handlerCode).matchAll(/\bvoid\s+([A-Za-z_]\w*)\s*\(/g),
    ].map((m) => m[1]),
  );
  const handlers = [
    ...new Set(
      controls
        .flatMap((c) => [
          c.eventClick,
          c.eventTextChanged,
          c.eventSelectedIndexChanged,
          c.eventCheckedChanged,
        ])
        .filter(Boolean),
    ),
  ]
    .filter((name) => !declared.has(name))
    .map(
      (name) =>
        `        private void ${name}(object sender, System.EventArgs e)\n        {\n            // Add your event logic here.\n        }`,
    )
    .join("\n\n");
  const statements = designerCode(controls)
    .split("\n")
    .map((line) => "            " + line)
    .join("\n");
  return {
    "CodeQuestForms.csproj":
      '<Project Sdk="Microsoft.NET.Sdk">\n  <PropertyGroup>\n    <OutputType>WinExe</OutputType>\n    <TargetFramework>net8.0-windows</TargetFramework>\n    <UseWindowsForms>true</UseWindowsForms>\n    <Nullable>disable</Nullable>\n  </PropertyGroup>\n</Project>\n',
    "Program.cs":
      "using System;\nusing System.Windows.Forms;\nnamespace CodeQuestForms { static class Program { [STAThread] static void Main() { Application.EnableVisualStyles(); Application.SetCompatibleTextRenderingDefault(false); Application.Run(new Form1()); } } }\n",
    "Form1.cs": `using System;\nusing System.Windows.Forms;\nusing System.Linq;\nnamespace CodeQuestForms\n{\n    public partial class Form1 : System.Windows.Forms.Form\n    {\n        public Form1() { InitializeComponent(); }\n${handlers}\n${handlerCode}\n    }\n}\n`,
    "Form1.Designer.cs": `namespace CodeQuestForms\n{\n    partial class Form1\n    {\n${fields}\n        private void InitializeComponent()\n        {\n            this.SuspendLayout();\n${statements}\n            this.ClientSize = new System.Drawing.Size(640, 420);\n            this.Text = "My CodeQuest Form";\n            this.Name = "Form1";\n            this.ResumeLayout(false);\n            this.PerformLayout();\n        }\n    }\n}\n`,
    "CodeQuestForms.sln":
      'Microsoft Visual Studio Solution File, Format Version 12.00\n# Visual Studio Version 17\nVisualStudioVersion = 17.0.31903.59\nMinimumVisualStudioVersion = 10.0.40219.1\nProject("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "CodeQuestForms", "CodeQuestForms.csproj", "{85A24500-16C1-42B0-9999-541C541FCDF1}"\nEndProject\nGlobal\n    GlobalSection(SolutionConfigurationPlatforms) = preSolution\n        Debug|Any CPU = Debug|Any CPU\n        Release|Any CPU = Release|Any CPU\n    EndGlobalSection\n    GlobalSection(ProjectConfigurationPlatforms) = postSolution\n        {85A24500-16C1-42B0-9999-541C541FCDF1}.Debug|Any CPU.ActiveCfg = Debug|Any CPU\n        {85A24500-16C1-42B0-9999-541C541FCDF1}.Debug|Any CPU.Build.0 = Debug|Any CPU\n        {85A24500-16C1-42B0-9999-541C541FCDF1}.Release|Any CPU.ActiveCfg = Release|Any CPU\n        {85A24500-16C1-42B0-9999-541C541FCDF1}.Release|Any CPU.Build.0 = Release|Any CPU\n    EndGlobalSection\nEndGlobal\n',
    "README.txt":
      "Open CodeQuestForms.sln in Visual Studio on Windows with the .NET desktop development workload. Build and run the form. Event handlers are wired with editable empty bodies: add your business logic in Form1.cs. Native WinForms runs on Windows, not in a web browser.\n",
  };
}
export function projectZip(controls, options = {}) {
  return zipSync(
    Object.fromEntries(
      Object.entries(projectFiles(controls, options)).map(([name, content]) => [
        name,
        strToU8(content),
      ]),
    ),
  );
}

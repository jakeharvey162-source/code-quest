# Developer Studio: local C# projects

Code Lab and WinForms share the existing account-scoped C# item collection. Solution Explorer displays one local solution, one project, folders and editable C# files. This is a browser learning workspace, not an MSBuild solution loader or a native Visual Studio debugger.

- Use the tree or **Active C# file** to open a document. Arrow keys traverse and expand/collapse the tree; Home/End move to its first/last visible row; Enter/Space open a file. Selecting a document reveals its folder ancestors.
- **Add class / C# item** (Ctrl+Shift+A) accepts an optional relative folder, for example `Models/Bank`. Folders appear when they contain files; empty folders are not persisted.
- **Rename / move file** changes the relative path only. Class names, namespaces, handler names and references in C# are preserved. Update those explicitly if needed.
- **Delete file** requires confirmation. Removal does not edit references in other documents. Export a ZIP before removing code you may need later. The main and generated source filenames are protected.
- File actions persist before selection changes. Storage failures retain the existing files and selection; export a project if browser storage is full or blocked.

New paths use portable identifier-based filenames and folder segments, reject traversal, Windows device names and case-insensitive duplicate paths, and retain the existing limits of 20 additional files and 50,000 characters per item. Previously saved root filenames remain readable, including older nonportable names; a warning recommends renaming them before extracting a native project on Windows. No automatic rename or storage migration discards their content.

Console ZIP import keeps paths relative to the single `Program.cs` directory. Multiple main files or C# sources outside that directory are rejected rather than silently merged. Distinct folders may contain identically named files; the C# types still need valid distinct namespaces/names. Console and Windows project exports preserve folder paths. WinForms restoration keeps them in `codequest-form.json`.

The browser compiler combines source strings and leading imports; it does not execute project references, NuGet, MSBuild targets or arbitrary native Windows APIs. Compiler messages currently refer to the transformed source, so this increment does not invent file/line diagnostic navigation. Recorded debugging remains replay, not a live native pause/step debugger. See [the platform plan](PLATFORM-PLAN.md) for the next increments.

## Verify this increment

From the repository root:

```sh
npm run check
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser -- tests/solution-explorer.spec.mjs tests/ide-upgrade.spec.mjs
```

Omit `CHROMIUM_EXECUTABLE_PATH` when using Playwright's installed Chromium. The explorer suite covers real console and WinForms C# runs, nested ZIP round-trips, keyboard/focus behavior, legacy storage, rejected paths, storage errors and desktop/phone axe checks. Native Windows export compilation still runs in Windows .NET 8 CI.

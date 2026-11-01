# Native export validation

Validated on 29 October 2026 in the Linux development environment.

- Exported the existing sample using `node scripts/export-sample.mjs`.
- Installed the official Microsoft .NET SDK **8.0.427** outside the checkout, with TLS verification enabled and the artifact's SHA-512 verified against Microsoft's .NET 8 release metadata.
- Built the generated `CodeQuestForms.sln` in Release with `-p:EnableWindowsTargeting=true`.
- Result: **build succeeded, 0 warnings, 0 errors**. The generated `net8.0-windows/CodeQuestForms.dll` was produced.

The sample was copied to `/tmp/codequest-native` before building so browser-test cleanup could not remove it. The SDK and NuGet cache are local setup artifacts and are not committed.

This validates cross-compilation of the exported Windows Forms project. Running its native desktop window requires Windows. The existing `native-export` CI job on `windows-latest` remains the Windows validation path; its result for this branch must be checked after the pull request runs.

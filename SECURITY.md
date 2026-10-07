# Security Policy

## Supported version
Security fixes target the latest CodeQuest release candidate and current production release.

## Reporting
Do not publish credentials, exploit details or sensitive learner data in a public issue. Prefer GitHub private vulnerability reporting/security advisories when available. If private reporting is unavailable, open a minimal issue requesting a private security contact without exploit details.

Include affected commit/version, safe reproduction steps, impact and browser/OS where relevant.

## Secrets
The core app requires no secret client credentials. Never put secrets in VITE_* variables because those values are exposed to browser code. Future server/edge secrets belong in encrypted deployment environment settings and must not be committed.

If a secret is exposed, revoke/rotate it first, remove it from active configuration and investigate repository/deployment history.

## Boundaries
Browser C# runs in a dedicated Web Worker with execution controls; it is not a general server-side code-execution service. Native WinForms code is exported for local Windows execution. Assessment data is formative and is not designed as tamper-proof examination data.

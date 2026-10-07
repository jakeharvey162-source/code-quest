# CodeQuest Release and Distribution

## Recommended public setup

- Vercel: canonical web/PWA build and primary Play link.
- itch.io: free discovery/storefront page for the coding-adventure experience.
- GitHub Releases: versioned Windows packages and technical release notes.
- Android store/package: only after a genuinely device-tested Android build exists.

## Release gate

Before production, verify the exact candidate: unit/regression tests, typecheck/build, Chromium journeys, real C# execution, compiler warm-cache offline execution, PWA reload/update, mobile layout, accessibility, WinForms resize/default events/export, and native .NET 8 WinForms compilation.

## Vercel

Import the GitHub repository, use Vite, repository root, npm ci, npm run build and dist. Use branch Preview deployments first and reviewed main for Production. Never store secrets in VITE_* variables.

## itch.io package/page

Present CodeQuest as an Educational HTML game in Beta. Use a free or donation-enabled page. Upload only a tested production web ZIP containing index.html, or use the itch page as the discovery storefront linking to the canonical PWA when service-worker/install behaviour is important.

Suggested page copy:

CodeQuest is a coding adventure where you learn C# by predicting, building, running, breaking and fixing real code. Explore African-inspired learning districts, build Windows Forms interfaces in the Makers Yard, face Assessment Arena challenges, and learn with Tor beside you.

Suggested screenshots:
1. World map and districts.
2. Real C# quest/editor and output.
3. WinForms Makers Yard designer.
4. Tor remediation moment.
5. Assessment Arena/result.

Suggested tags: Educational, Programming, Coding, C Sharp, Learning, Puzzle.

## Public launch kit

Prepare one canonical Play URL, 5 screenshots, a 20-40 second trailer, logo/icon, one-sentence promise, feature/platform bullets, privacy/security note, version/changelog and issue-report link.

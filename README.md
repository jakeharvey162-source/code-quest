# CodeQuest — C# Adventure

A bright African-first, globally usable learning game for C#, WinForms and OOP.

## Working foundation
- Quest map inspired by African cities
- C# Code Lab with OOP boss mission
- Inheritance, polymorphism, abstraction/interface curriculum map
- Progressive Tor feedback and opt-in roast personality
- Local progress/code persistence
- Assessment question skill detection
- Language preference and browser speech output
- Study date + notification opt-in
- Responsive UI

## Architecture
The current checker is deterministic so learning missions work without an AI API. The compiler boundary is intentionally modular; full browser-side Roslyn/.NET WebAssembly execution is the next engine layer. WinForms will be taught through a purpose-built designer/simulator because native Windows Forms is Windows-specific.

## Run
```bash
npm install
npm run build
npm run dev
```

Development branch: `dev/codequest-foundation`.

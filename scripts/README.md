# Developer utilities

Run these from the repository root. They are diagnostics or asset-generation tools, not required to start the game.

| Script | Purpose | Usage / prerequisite |
| --- | --- | --- |
| `generate-commentary.ps1` | Generate commentary audio | Windows PowerShell speech support; inspect the script before regenerating tracked audio |
| `trace-shot.ts` | Reproduce the opening physical shot | `npx tsx scripts/trace-shot.ts`; create `artifacts/` first |
| `review-models.mjs` | Capture the procedural-model review scene | Starts no server; expects the development client at `http://localhost:5174/?models=1`, installed Playwright Chromium, and `artifacts/verification/` |

For normal development use `npm run dev`. For repeatable validation use the maintained tests described in [docs/TESTING.md](../docs/TESTING.md). Diagnostic output belongs in ignored `artifacts/`, not source control.

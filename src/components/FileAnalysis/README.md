# GENiSYS Tooling — Forensics / File Analysis module

Drop-in feature module for `src/components/FileAnalysis/` in the GENiSYS
Astro + React + Tailwind SPA.

## Integration

1. Copy this entire folder to `src/components/FileAnalysis/` in the GENiSYS
   repo.
2. In `GenisysApp.tsx` (or wherever the shell wires up routes), import and
   render the page inside the existing main content area:

   ```tsx
   import { FileAnalysisPage } from "@/components/FileAnalysis";

   // ...inside the existing route switch:
   case "forensics":
     return <FileAnalysisPage />;
   ```

   No `BrowserRouter`, shell, or sidebar changes are needed — the module owns
   no routing or layout chrome beyond its own content.

3. Make sure your bundler is configured to load `.worker.ts` files as Web
   Workers. Vite (which Astro uses) supports this out of the box via
   `new Worker(new URL(...), { type: "module" })`, which is exactly the
   pattern used in `lib/fileAnalysisWorkerClient.ts` — no extra Vite config
   should be required, but if your project pins a non-default `worker`
   format, confirm `format: "es"` is set for module workers.

4. If your project's `tsconfig.json` doesn't already include both the `DOM`
   and separate `WebWorker` typings for worker files, add (or confirm) a
   worker-specific TS project reference. The worker file already declares
   `/// <reference lib="webworker" />` at the top, which is sufficient for
   most Vite + TS setups without further config.

## What was verified in this environment

This sandbox has no network access, so the project's real `vitest`,
`@types/react`, and other npm dependencies could not be installed here.
Instead, verification was done as follows:

- **Type safety of all pure logic** (`types/`, `lib/`, `workers/`,
  `tests/`): compiled cleanly with a strict, `noUnusedLocals` /
  `noUnusedParameters` TypeScript config (`tsc --noEmit`), once under a
  `DOM` lib context and once under a `WebWorker` lib context (matching how
  a real project typechecks app code vs. worker code separately).
- **All 86 unit tests pass.** Since `vitest` itself couldn't be installed
  offline, a minimal API-compatible shim (`describe`/`it`/`expect` with the
  matchers actually used by these tests) was used to execute the real test
  files unmodified via `tsx`. Every test file listed in the spec exists and
  passes: `fileIdentifier`, `metadataExtractor`, `stringExtractor`,
  `hexReader`, `imageAnalyzer`, `archiveInspector`, `steganography`,
  `binaryAnalyzer`, `fileReconstructor`, `fileSignatures`, `formatGuesser`.
- **`.tsx` component files** could not be fully typechecked here (no
  `@types/react` available offline), so they were reviewed manually for
  type consistency, unused imports/variables, and correct prop wiring.
  Once this folder is inside the real project with its existing
  `react`/`@types/react`/`vitest` dependencies, run:

  ```bash
  npm test
  npx tsc --noEmit
  ```

  to confirm end-to-end in the real environment.

## Notable implementation choices

- **Buffer handling**: when a file is loaded, one `Uint8Array` copy is kept
  on the main thread (for the Hex Viewer, string/candidate export, and
  on-demand hashing) and a second copy is transferred (zero-copy) into the
  analysis worker. This is a single, deliberate duplication — not a
  per-operation copy — needed because the worker's input buffer is
  transferred and therefore detached from the caller.
- **Conservative confidence levels**: every signature match carries
  `"confirmed" | "probable" | "unknown"`, and a matching file extension can
  never upgrade a signature's confidence — it can only be flagged as
  mismatched.
- **No fabricated results**: EXIF, advanced PDF metadata, and non-ZIP
  archive formats are explicitly reported as unavailable/unsupported rather
  than guessed. Steganography and recovery panels use hedged language
  ("candidate", "unexpected trailing bytes") rather than asserting hidden
  data or recoverability.
- **Bounded UI**: strings are paginated (100/page) and capped at 5,000
  matches per worker pass (10,000 on manual re-extraction); the hex viewer
  renders a fixed 32-row window and reads directly from the in-memory
  `Uint8Array` rather than building one giant string.

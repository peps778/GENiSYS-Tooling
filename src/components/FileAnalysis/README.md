

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

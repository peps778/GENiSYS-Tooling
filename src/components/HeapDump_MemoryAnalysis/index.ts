/**
 * Public entry point for the HeapDump_MemoryAnalysis module.
 *
 * The rest of GENiSYS Tooling (GenisysApp.tsx) must only ever import
 * from this file:
 *
 *   import HeapDumpPage from "./HeapDump_MemoryAnalysis";
 *
 * All internal files (components/, panels/, lib/, workers/, types/)
 * are private implementation details of this module.
 */
export { default } from "./HeapDumpPage";
export type { HeapDumpTabId, HeapSummary } from "./types/heap";

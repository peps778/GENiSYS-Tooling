export function SafetyNotice() {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900">
      <strong>Scope:</strong> Network and web testing examples are written for systems you own or are explicitly authorized to assess. The browser-side generator only produces, validates, and copies command text; it never executes shell commands.
    </div>
  );
}

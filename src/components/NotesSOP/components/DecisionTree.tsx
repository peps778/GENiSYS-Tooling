import type { SOPBranch } from "../types/notesSop";

export default function DecisionTree({ branches }: { branches: SOPBranch[] }) {
  return (
    <div className="space-y-3">
      {branches.map((branch) => (
        <div key={branch.id} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex gap-3">
            <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-green-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">If: {branch.condition}</p>
              <p className="mt-1 text-xs text-gray-500">Result: {branch.result}</p>
              <p className="mt-2 text-sm text-gray-700">Next: {branch.nextAction}</p>
              {branch.evidence?.length ? <p className="mt-2 text-xs text-gray-500">Evidence: {branch.evidence.join(" • ")}</p> : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

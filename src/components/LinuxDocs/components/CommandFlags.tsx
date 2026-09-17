import type { CommandFlag } from '../types/linuxDocs';

export function CommandFlags({ flags }: { flags: CommandFlag[] }) {
  if (!flags.length) return null;
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="min-w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-3 py-2 font-semibold">Flag</th>
            <th className="px-3 py-2 font-semibold">Purpose</th>
          </tr>
        </thead>
        <tbody>
          {flags.map((flag) => (
            <tr key={flag.flag} className="border-t border-slate-200">
              <td className="whitespace-nowrap px-3 py-2 font-mono text-emerald-700">
                {flag.flag}
              </td>
              <td className="px-3 py-2 text-slate-600">{flag.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

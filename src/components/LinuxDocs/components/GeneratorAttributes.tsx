import type { GeneratorAttribute } from '../types/linuxDocs';

export function GeneratorAttributes({
  attributes,
  values,
  onChange,
}: {
  attributes: GeneratorAttribute[];
  values: Record<string, string | boolean>;
  onChange: (id: string, value: string | boolean) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {attributes.map((attribute) => {
        const value =
          values[attribute.id] ??
          attribute.defaultValue ??
          (attribute.type === 'boolean' ? false : '');
        return (
          <label key={attribute.id} className="min-w-0">
            <span className="mb-1 block text-xs font-semibold text-slate-700">
              {attribute.label}
            </span>
            {attribute.type === 'boolean' ? (
              <span className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(event) =>
                    onChange(attribute.id, event.target.checked)
                  }
                />
                Enabled
              </span>
            ) : attribute.type === 'select' ? (
              <select
                value={String(value)}
                onChange={(event) => onChange(attribute.id, event.target.value)}
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {attribute.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={attribute.type}
                value={String(value)}
                onChange={(event) => onChange(attribute.id, event.target.value)}
                placeholder={attribute.placeholder}
                className="h-9 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            )}
          </label>
        );
      })}
    </div>
  );
}

import type { ReferenceItem } from '../types/networkRecon';
export function searchReferences(
  items: ReferenceItem[],
  query: string,
): ReferenceItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) =>
    [item.title, item.category, item.description, ...item.tags]
      .join(' ')
      .toLowerCase()
      .includes(q),
  );
}

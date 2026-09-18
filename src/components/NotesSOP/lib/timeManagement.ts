export function shouldPivot(
  elapsedMinutes: number,
  newInformation: boolean,
  strongLead: boolean,
): boolean {
  if (strongLead && newInformation) return false;
  if (!newInformation && elapsedMinutes >= 10) return true;
  return elapsedMinutes >= 20 && !strongLead;
}

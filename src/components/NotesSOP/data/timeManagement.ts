export const timeCases = [
  {
    id: "time-no-foothold",
    title: "No foothold after initial discovery",
    checks: ["List exposed surfaces", "Mark completed paths", "Identify unexplored surface", "Record dead ends"],
    branches: ["Promising lead exists → validate it", "All known paths exhausted → pivot", "Scope unclear → resolve scope before continuing"],
  },
  {
    id: "time-promising-lead",
    title: "A promising lead appeared",
    checks: ["Establish baseline", "Make one controlled change", "Compare response", "Record evidence"],
    branches: ["Evidence strengthens → continue", "Evidence weakens → pivot", "Impact unclear → gather context"],
  },
  {
    id: "time-final-minutes",
    title: "Limited time remaining",
    checks: ["Verify strongest findings", "Record evidence", "Revisit strong leads", "Avoid starting complex low-confidence paths"],
    branches: ["Finding is nearly verified → finish verification", "Finding is weak → preserve evidence and pivot", "No lead → inspect obvious exposed surfaces"],
  },
];

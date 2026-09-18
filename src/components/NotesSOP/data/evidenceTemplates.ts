import type { EvidenceFinding } from "../types/notesSop";

export const emptyFinding = (): EvidenceFinding => ({
  id: `F-${Date.now()}`,
  timestamp: new Date().toISOString(),
  category: "evidence",
  source: "",
  target: "",
  observation: "",
  interpretation: "",
  confidence: "low",
  evidenceType: "Command output",
  status: "candidate",
});

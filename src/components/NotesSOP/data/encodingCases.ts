import type { SOPCase } from "../types/notesSop";

export const encodingCases: SOPCase[] = [
  {
    id: "encoding-encoded-text",
    category: "encoding",
    title: "Encoded-Looking Text",
    summary: "A string has a restricted alphabet or structure suggesting a transformation.",
    whenToUse: ["Long opaque string", "Challenge clue", "Extracted text from a file"],
    prerequisites: ["Exact string preserved"],
    observations: ["Length", "Alphabet", "Padding", "Separators", "Printability"],
    initialChecks: ["Check for JWT structure", "Check hex/base64-like alphabet", "Check URL percent encoding"],
    steps: [
      { id: "a", action: "Classify the alphabet", purpose: "Choose transformations based on observable evidence.", expectedObservation: "A recognizable alphabet or delimiter pattern.", possibleResults: ["Hex-like", "Base64-like", "JWT-like", "URL encoded", "Unknown"], evidence: ["Exact input", "Classification"] },
    ],
    branches: [
      { id: "jwt", condition: "Three dot-separated URL-safe segments", result: "JWT candidate", nextAction: "Decode header/payload and clearly label them as unverified until cryptographically validated.", evidence: ["Header", "Payload"] },
      { id: "hex", condition: "Mostly hexadecimal characters with even length", result: "Hex candidate", nextAction: "Decode as bytes and re-classify the result.", evidence: ["Input/output"] },
      { id: "b64", condition: "Base64-like alphabet/padding", result: "Base64 candidate", nextAction: "Decode once, inspect the output, then classify again.", evidence: ["Input/output"] },
      { id: "unknown", condition: "No reliable encoding clue", result: "Unknown transformation", nextAction: "Inspect context and avoid blindly applying every decoder.", evidence: ["Observed structure"] },
    ],
    alternativePaths: ["Check file signature if decoded output is binary", "Inspect challenge context", "Try character-level transforms only when evidence supports them"],
    evidenceToRecord: ["Exact input", "Detection clue", "Transformation", "Output", "Confidence"],
    stopConditions: ["Do not transform repeatedly without a new clue", "Preserve the original input"],
    relatedCases: ["stego-image", "web-api"],
    estimatedTime: "2–10 min",
    difficulty: "beginner",
    tags: ["base64", "hex", "jwt", "url", "encoding"],
  },
];

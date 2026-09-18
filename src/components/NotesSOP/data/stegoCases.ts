import type { SOPCase } from "../types/notesSop";

export const stegoCases: SOPCase[] = [
  {
    id: "stego-image",
    category: "stego",
    title: "Suspicious Image",
    summary: "An image may contain metadata, appended data, embedded files, or hidden content.",
    whenToUse: ["Challenge image", "Image recovered from .bin", "Suspicious dimensions/metadata"],
    prerequisites: ["Original image preserved"],
    observations: ["Format", "Dimensions", "Metadata", "Strings", "Trailing bytes"],
    initialChecks: ["Identify actual format", "Inspect metadata", "Search strings", "Check file size versus expected structure"],
    steps: [
      { id: "a", action: "Inspect metadata", purpose: "Look for descriptive or anomalous fields.", expectedObservation: "Camera/software/comment/location-like metadata or none.", possibleResults: ["Interesting metadata", "Normal metadata"], evidence: ["Metadata fields"] },
      { id: "b", action: "Search for appended/embedded content", purpose: "Determine whether additional data follows or is embedded in the image structure.", command: "strings -a image.png", expectedObservation: "Readable content, filenames, URLs, or signatures.", possibleResults: ["Interesting string", "Embedded signature", "Nothing obvious"], evidence: ["String and offset"] },
    ],
    branches: [
      { id: "embedded", condition: "Another file signature is found", result: "Embedded-data case", nextAction: "Bound and recover the candidate, then analyze it as a separate artifact.", nextCaseId: "forensics-embedded", evidence: ["Signature offset"] },
      { id: "text", condition: "Encoded-looking text is found", result: "Encoding case", nextAction: "Use the encoding decision tree based on alphabet and structure.", nextCaseId: "encoding-encoded-text", evidence: ["Exact string"] },
      { id: "none", condition: "No obvious clue", result: "Deeper stego analysis", nextAction: "Compare channels/planes and use format-specific stego analysis.", evidence: ["Analysis performed"] },
    ],
    alternativePaths: ["Visual comparison", "PNG/JPEG structural analysis", "Audio analysis for WAV/other supported formats"],
    evidenceToRecord: ["Original hash", "Format", "Dimensions", "Metadata", "String offsets", "Recovered candidates"],
    stopConditions: ["Do not modify the original artifact", "Do not call a candidate confirmed without structural validation"],
    relatedCases: ["forensics-embedded", "encoding-encoded-text"],
    estimatedTime: "10–30 min",
    difficulty: "intermediate",
    tags: ["stego", "png", "jpeg", "metadata", "embedded"],
  },
];

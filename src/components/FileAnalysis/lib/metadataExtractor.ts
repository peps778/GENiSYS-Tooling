import type { FileMetadata, MetadataField, FileIdentification } from "../types/fileAnalysis";
import { readImageDimensions } from "./imageAnalyzer";
import { inspectZipArchive, looksLikeZip } from "./archiveInspector";

function field(label: string, value: string | number | null, status: MetadataField["status"]): MetadataField {
  return { label, value, status };
}

const IMAGE_FORMATS = new Set(["PNG image", "JPEG image", "GIF image", "BMP image", "WebP image", "TIFF image (little-endian)", "TIFF image (big-endian)"]);

function extractImageMetadata(data: Uint8Array, identification: FileIdentification): FileMetadata {
  const format = identification.detectedType;
  const dims = readImageDimensions(data, format);
  const limitations: string[] = [];

  const fields: MetadataField[] = [
    field("Format", format, "available"),
    field("Width", dims?.width ?? null, dims ? "available" : "unavailable"),
    field("Height", dims?.height ?? null, dims ? "available" : "unavailable"),
  ];

  if (format === "PNG image" && data.length >= 26) {
    const colorTypeMap: Record<number, string> = {
      0: "Grayscale", 2: "Truecolor (RGB)", 3: "Indexed (palette)",
      4: "Grayscale + alpha", 6: "Truecolor + alpha (RGBA)",
    };
    const bitDepth = data[24];
    const colorType = data[25];
    fields.push(field("Bit depth", bitDepth, "available"));
    fields.push(field("Color type", colorTypeMap[colorType] ?? `Unknown (${colorType})`, "available"));
  } else {
    fields.push(field("Color information", null, "unavailable"));
  }

  // EXIF requires a dedicated parser we do not bundle; be explicit about the gap
  // rather than fabricating fields.
  fields.push(field("EXIF metadata", null, "unavailable"));
  limitations.push("EXIF metadata extraction requires a dedicated parser not included in this build.");

  return { category: "image", fields, limitations };
}

function extractPdfMetadata(data: Uint8Array): FileMetadata {
  const limitations: string[] = [];
  const fields: MetadataField[] = [];

  const header = new TextDecoder("latin1").decode(data.subarray(0, Math.min(16, data.length)));
  const versionMatch = /%PDF-(\d\.\d)/.exec(header);
  fields.push(field("PDF version", versionMatch ? versionMatch[1] : null, versionMatch ? "available" : "unavailable"));

  // Look for a Info dictionary's common keys in the raw bytes (best-effort,
  // works for uncompressed metadata only -- many PDFs compress object
  // streams, which this cannot decode without a full PDF parser).
  const text = new TextDecoder("latin1").decode(data.subarray(0, Math.min(data.length, 2 * 1024 * 1024)));
  const grab = (key: string) => {
    const m = new RegExp(`/${key}\\s*\\(([^)]*)\\)`).exec(text);
    return m ? m[1] : null;
  };
  const title = grab("Title");
  const author = grab("Author");
  const producer = grab("Producer");
  const creator = grab("Creator");

  fields.push(field("Title", title, title ? "available" : "unavailable"));
  fields.push(field("Author", author, author ? "available" : "unavailable"));
  fields.push(field("Producer", producer, producer ? "available" : "unavailable"));
  fields.push(field("Creator", creator, creator ? "available" : "unavailable"));

  limitations.push(
    "Only uncompressed Info-dictionary fields in the first portion of the file are scanned; " +
      "PDFs with compressed object streams or XMP-only metadata may show fields as unavailable even though metadata exists."
  );

  return { category: "pdf", fields, limitations };
}

function extractArchiveMetadata(data: Uint8Array): FileMetadata {
  const limitations: string[] = [];
  const fields: MetadataField[] = [];

  if (!looksLikeZip(data)) {
    fields.push(field("Archive type", "Unsupported for detailed inspection", "unavailable"));
    limitations.push("Only ZIP archives are inspected in detail in this build.");
    return { category: "archive", fields, limitations };
  }

  const archive = inspectZipArchive(data);
  fields.push(field("Archive type", "ZIP", "available"));
  fields.push(field("Entry count", archive.entryCount, "available"));
  const totalCompressed = archive.entries.reduce((sum, e) => sum + e.compressedSize, 0);
  const totalUncompressed = archive.entries.reduce((sum, e) => sum + e.uncompressedSize, 0);
  fields.push(field("Total compressed size", totalCompressed, "available"));
  fields.push(field("Total uncompressed size", totalUncompressed, "available"));
  limitations.push(...archive.limitations);

  return { category: "archive", fields, limitations };
}

function extractGenericMetadata(
  _data: Uint8Array,
  identification: FileIdentification,
  sizeBytes: number
): FileMetadata {
  const fields: MetadataField[] = [
    field("Size (bytes)", sizeBytes, "available"),
    field("Detected format", identification.detectedType, identification.confidence !== "unknown" ? "available" : "unavailable"),
    field("MIME guess", identification.mime, identification.mime ? "available" : "unavailable"),
    field("Reported extension", identification.reportedExtension || null, identification.reportedExtension ? "available" : "unavailable"),
    field("Magic bytes", identification.signature?.magicHex ?? null, identification.signature ? "available" : "unavailable"),
  ];
  return { category: "generic", fields, limitations: [] };
}

/**
 * Produces format-aware metadata. Never invents fields for a format that
 * doesn't support them -- categories other than the detected one report
 * "not-applicable" rather than being omitted, so the UI can show the full
 * picture of what was and wasn't checked.
 */
export function extractMetadata(
  data: Uint8Array,
  identification: FileIdentification,
  sizeBytes: number
): FileMetadata {
  if (IMAGE_FORMATS.has(identification.detectedType)) {
    return extractImageMetadata(data, identification);
  }
  if (identification.detectedType === "PDF document") {
    return extractPdfMetadata(data);
  }
  if (identification.detectedType.startsWith("ZIP archive")) {
    return extractArchiveMetadata(data);
  }
  return extractGenericMetadata(data, identification, sizeBytes);
}

import React from "react";
import type { ImageInformation } from "../types/fileAnalysis";

interface ImageAnalysisPanelProps {
  image: ImageInformation;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-[#6B7280]">{label}</span>
      <span className="text-[#111827]">{value}</span>
    </div>
  );
}

export function ImageAnalysisPanel({ image }: ImageAnalysisPanelProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#6B7280]">Preview</p>
        {image.objectUrl ? (
          <div className="flex items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.objectUrl}
              alt="Loaded file preview"
              className="max-h-80 max-w-full rounded-[6px] object-contain"
            />
          </div>
        ) : (
          <p className="text-sm text-[#9CA3AF]">Preview unavailable.</p>
        )}
      </div>

      <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6B7280]">Image Properties</p>
        <div className="divide-y divide-[#E5E7EB]">
          <Row label="Format" value={image.format} />
          <Row label="MIME" value={<span className="font-mono">{image.mime ?? "—"}</span>} />
          <Row
            label="Dimensions"
            value={image.width !== null && image.height !== null ? `${image.width} × ${image.height}` : "Unavailable"}
          />
          <Row label="Color info" value={image.colorInfo ?? "Unavailable"} />
          <Row
            label="Transparency"
            value={image.hasAlpha === null ? "Unknown" : image.hasAlpha ? "Yes" : "No"}
          />
          <Row label="EXIF metadata" value={image.exifAvailable ? "Available" : "Unavailable"} />
        </div>

        {!image.exifAvailable && (
          <p className="mt-3 text-xs text-[#9CA3AF]">
            EXIF extraction requires a dedicated parser that isn't included in this build.
          </p>
        )}
      </div>
    </div>
  );
}

export default ImageAnalysisPanel;

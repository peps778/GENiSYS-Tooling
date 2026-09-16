/**
 * FileDropzone.tsx
 *
 * Presentational drag-and-drop / click-to-browse file picker. Contains
 * no analysis logic — it only ever hands a File back to its parent via
 * onFileSelected. Styled to the GENiSYS white/charcoal/technical-green
 * identity: flat surfaces, restrained accents, no glow or gradients.
 */
import { useCallback, useRef, useState } from "react";
import { UploadIcon } from "./icons";

export interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  acceptedExtensions?: string[];
}

const DEFAULT_ACCEPTED = [".heapsnapshot", ".snapshot", ".json", ".raw", ".bin", ".dmp"];

export default function FileDropzone({
  onFileSelected,
  disabled = false,
  acceptedExtensions = DEFAULT_ACCEPTED,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0 || disabled) return;
      onFileSelected(fileList[0]);
    },
    [disabled, onFileSelected]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={[
        "flex flex-col items-center justify-center gap-3 rounded-md border border-dashed px-6 py-12 text-center transition-colors",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        isDragging ? "border-[#16A34A] bg-[#F0FDF4]" : "border-[#E5E7EB] bg-[#FFFFFF] hover:border-[#16A34A]",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={acceptedExtensions.join(",")}
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#F0FDF4] text-[#15803D]">
        <UploadIcon width={20} height={20} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[#111827]">
          Drop a heap snapshot, or click to browse
        </p>
        <p className="text-xs text-[#9CA3AF]">
          {acceptedExtensions.join("  \u00b7  ")}
        </p>
      </div>
    </div>
  );
}

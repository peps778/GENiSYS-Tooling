import React, { useCallback, useRef, useState } from "react";

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

const LARGE_FILE_WARNING_BYTES = 250 * 1024 * 1024; // 250 MB

export function FileDropzone({ onFileSelected, disabled }: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [pendingWarning, setPendingWarning] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (file.size > LARGE_FILE_WARNING_BYTES) {
        setPendingWarning(
          `${file.name} is ${(file.size / (1024 * 1024)).toFixed(0)} MB. Large files may take longer to analyze; processing runs in a background worker to keep the interface responsive.`
        );
      } else {
        setPendingWarning(null);
      }
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);
      if (disabled) return;
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [disabled, handleFile]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = ""; // allow re-selecting the same file
    },
    [handleFile]
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Select a file to analyze"
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={onDrop}
        className={[
          "flex flex-col items-center justify-center gap-2 rounded-[12px] border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer",
          disabled ? "opacity-50 cursor-not-allowed" : "",
          isDragActive
            ? "border-[#16A34A] bg-[#F0FDF4]"
            : "border-[#E5E7EB] bg-white hover:border-[#BBF7D0] hover:bg-[#F0FDF4]/40",
        ].join(" ")}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14"
            stroke="#16A34A"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="text-sm font-medium text-[#111827]">
          Drop a file here, or click to browse
        </p>
        <p className="text-xs text-[#9CA3AF]">
          Single-file analysis. Files are processed locally in your browser.
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={onInputChange}
          disabled={disabled}
        />
      </div>
      {pendingWarning && (
        <p className="mt-2 text-xs text-[#6B7280]">{pendingWarning}</p>
      )}
    </div>
  );
}

export default FileDropzone;

import React, { useCallback, useRef, useState } from 'react';

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  fileName?: string | null;
}

export default function FileDropzone({
  onFileSelected,
  fileName,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (files && files.length > 0) onFileSelected(files[0]);
    },
    [onFileSelected],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload a file for signature analysis"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={[
        'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border-2 border-dashed px-4 py-8 text-center transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]',
        isDragging
          ? 'border-[#16A34A] bg-[#F0FDF4]'
          : 'border-[#E5E7EB] bg-white hover:border-[#16A34A]',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-[#111827]">
        {fileName ? fileName : 'Drop a file here or click to browse'}
      </p>
      <p className="text-xs text-[#6B7280]">
        Files are analyzed locally and never uploaded.
      </p>
    </div>
  );
}

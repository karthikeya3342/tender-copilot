"use client";
import { useState, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onFile: (file: File) => void;
  accept?: string;
  label?: string;
  sublabel?: string;
  compact?: boolean;
  className?: string;
}

export function DropZone({
  onFile,
  accept = ".pdf",
  label = "Drop your PDF here",
  sublabel = "or click to browse",
  compact = false,
  className,
}: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) {
        setFile(dropped);
        onFile(dropped);
      }
    },
    [onFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) {
      setFile(picked);
      onFile(picked);
    }
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
  };

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center cursor-pointer transition-all duration-200",
        "border-2 border-dashed rounded-3xl",
        compact ? "py-6 px-4" : "py-12 px-6",
        dragging
          ? "border-[#7C6FF7] bg-[#F3EFFF] scale-[1.01]"
          : "border-[#C4B8FF] bg-white/60 hover:bg-[#F8F6FF] hover:border-[#7C6FF7]",
        className
      )}
      style={{
        boxShadow: dragging
          ? "inset 2px 2px 8px rgba(124,111,247,0.12), 0 4px 20px rgba(124,111,247,0.15)"
          : "inset 2px 2px 6px rgba(255,255,255,0.8), 2px 2px 12px rgba(0,0,0,0.04)"
      }}
    >
      <input type="file" accept={accept} onChange={handleChange} className="sr-only" />

      {file ? (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E8F8F0] flex items-center justify-center"
            style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.8), 1px 1px 5px rgba(0,0,0,0.06)" }}>
            <FileText className="w-5 h-5 text-[#22C55E]" />
          </div>
          <div>
            <p className="text-sm font-700 text-gray-700">{file.name}</p>
            <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <button
            onClick={clear}
            className="w-7 h-7 rounded-full bg-[#FEF2F2] flex items-center justify-center ml-2"
            style={{ boxShadow: "inset 1px 1px 3px rgba(255,255,255,0.7), 1px 1px 4px rgba(0,0,0,0.06)" }}
          >
            <X className="w-3.5 h-3.5 text-[#EF4444]" />
          </button>
        </div>
      ) : (
        <>
          <div className={cn(
            "rounded-2xl flex items-center justify-center mb-3",
            compact ? "w-10 h-10" : "w-14 h-14",
            dragging ? "bg-[#7C6FF7]" : "bg-[#F3EFFF]"
          )}
            style={{ boxShadow: "inset 1px 1px 4px rgba(255,255,255,0.7), 2px 2px 8px rgba(0,0,0,0.08)" }}>
            <Upload className={cn(compact ? "w-5 h-5" : "w-7 h-7", dragging ? "text-white" : "text-[#7C6FF7]")} />
          </div>
          <p className={cn("font-700 text-gray-700", compact ? "text-sm" : "text-base")}>{label}</p>
          <p className="text-xs text-gray-400 mt-1">{sublabel}</p>
          {!compact && (
            <p className="text-xs text-[#7C6FF7] mt-2 font-600">PDF files only · Max 10MB</p>
          )}
        </>
      )}
    </label>
  );
}

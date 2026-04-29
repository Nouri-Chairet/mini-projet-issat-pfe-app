import { useRef, useState, type DragEvent, type ChangeEvent } from "react";

/*
  FileDropzone — accessible drag-and-drop file picker (xlsx).

  Reused by the timetable importer and the bulk PFE importer. Click,
  keyboard activation, and drag-drop all converge to the same
  `onFile(file)` callback.
*/

interface FileDropzoneProps {
  accept?: string;
  file: File | null;
  onFile: (file: File | null) => void;
  accent?: string;
  description?: string;
  disabled?: boolean;
}

export const FileDropzone = ({
  accept = ".xlsx",
  file,
  onFile,
  accent = "var(--gold)",
  description = "Glissez un fichier Excel ici ou cliquez pour parcourir.",
  disabled = false,
}: FileDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOver, setIsOver] = useState(false);

  const openPicker = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] ?? null;
    onFile(next);
    if (event.target) {
      event.target.value = ""; // allow re-uploading the same file
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsOver(false);
    if (disabled) return;
    const next = event.dataTransfer.files?.[0] ?? null;
    if (next) {
      onFile(next);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!disabled) setIsOver(true);
  };

  const handleDragLeave = () => setIsOver(false);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleSelect}
        style={{ display: "none" }}
        disabled={disabled}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        aria-label="Choisir un fichier"
        style={{
          padding: "22px 22px",
          borderRadius: "var(--r-lg)",
          border: `1.5px dashed ${isOver ? accent : "var(--border2)"}`,
          background: isOver
            ? `linear-gradient(180deg, ${accent}1A, ${accent}06)`
            : "var(--bg2)",
          color: "var(--text2)",
          textAlign: "center",
          transition: "all 0.18s ease",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          outline: "none",
        }}
      >
        <div
          aria-hidden
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: `${accent}1A`,
            border: `1px solid ${accent}40`,
            color: accent,
            margin: "0 auto 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontFamily: "var(--font-mono)",
          }}
        >
          ⬆
        </div>
        {file ? (
          <>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                color: "var(--text)",
                wordBreak: "break-all",
              }}
            >
              {file.name}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--text3)",
                marginTop: 4,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              {(file.size / 1024).toFixed(1)} KB · cliquez pour remplacer
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>
              {description}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--text3)",
                marginTop: 6,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              Format accepté: {accept}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FileDropzone;

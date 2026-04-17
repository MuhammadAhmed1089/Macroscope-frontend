import { useCallback, useState } from "react";

export default function UploadZone({ onFile, uploaded, fileName, loading }) {
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback((file) => {
    if (!file) return;
    onFile(file);
  }, [onFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  }, [processFile]);

  const handleChange = (e) => processFile(e.target.files[0]);

  const ringClass = `upload-ring ${dragging ? "dragging" : ""} ${uploaded ? "done" : ""}`;

  // SVG dashes: full circle ≈ 520, show ~80% filled
  const circum = 520;
  const dashArray = uploaded ? `${circum} 0` : dragging ? `${circum * 0.9} ${circum * 0.1}` : `${circum * 0.7} ${circum * 0.3}`;

  return (
    <div className="upload-ring-container">
      <input
        id="file-input"
        type="file"
        accept=".xlsx,.xls,.csv,.json"
        style={{ display: "none" }}
        onChange={handleChange}
      />

      <div
        className={ringClass}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !loading && document.getElementById("file-input").click()}
      >
        <svg className="ring-svg" viewBox="0 0 180 180" fill="none">
          {/* Background ring */}
          <circle cx="90" cy="90" r="83" stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none"/>
          {/* Animated dashed ring */}
          <circle
            cx="90" cy="90" r="83"
            stroke={uploaded ? "var(--emerald)" : dragging ? "var(--blue)" : "var(--gold)"}
            strokeWidth={uploaded ? "2" : "1.5"}
            strokeDasharray={dashArray}
            strokeLinecap="round"
            fill="none"
            style={{ opacity: uploaded ? 0.7 : 0.5, transition: "stroke-dasharray 0.4s, stroke 0.3s" }}
          />
          {/* Dots along the ring */}
          {!uploaded && [0, 60, 120, 180, 240, 300].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x = 90 + 83 * Math.cos(rad);
            const y = 90 + 83 * Math.sin(rad);
            return <circle key={i} cx={x} cy={y} r="2.5" fill="var(--gold)" opacity="0.3"/>;
          })}
        </svg>

        <div className="ring-center">
          {uploaded ? (
            <>
              <span className="ring-icon">✅</span>
              <span className="ring-text">Loaded</span>
            </>
          ) : loading ? (
            <>
              <span className="ring-icon">⏳</span>
              <span className="ring-text">Uploading</span>
            </>
          ) : dragging ? (
            <>
              <span className="ring-icon">📂</span>
              <span className="ring-text">Drop it</span>
            </>
          ) : (
            <>
              <span className="ring-icon">📁</span>
              <span className="ring-text">Upload</span>
            </>
          )}
        </div>
      </div>

      <div className="upload-meta">
        <div className="upload-title">
          {uploaded ? "File Ready" : dragging ? "Release to upload" : "Drag & Drop your dataset"}
        </div>
        <div className="upload-hint">
          {uploaded ? "Click the ring to replace" : "or click the ring to browse"}
        </div>
        {!uploaded && (
          <div className="upload-formats">
            {[".xlsx", ".xls", ".csv"].map(ext => (
              <span key={ext} className="format-chip">{ext}</span>
            ))}
          </div>
        )}
        {uploaded && (
          <div className="upload-success" style={{marginTop: 14}}>
            <span style={{fontSize: 18}}>✅</span>
            <div>
              <div className="upload-success-name">{fileName}</div>
              <div className="upload-success-hint">Click ring to replace</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

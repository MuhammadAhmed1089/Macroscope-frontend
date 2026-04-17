import { useState, useCallback, useRef, useEffect } from "react";
import UploadZone from "./components/UploadZone";
import ConfigEditor from "./components/ConfigEditor";
import ResultsDashboard from "./components/ResultsDashboard";
import Toast from "./components/StatusBar";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const DOCS_URL = API.replace("/api", "") + "/docs";
const STEPS = [
  { id: 1, label: "Upload", sub: "Your dataset" },
  { id: 2, label: "Configure", sub: "Analysis type" },
  { id: 3, label: "Analyze", sub: "Run pipeline" },
  { id: 4, label: "Insights", sub: "Explore results" },
];

const PROC_STEPS = [
  "Parsing dataset structure",
  "Computing statistics",
  "Building visualizations",
  "Generating insights",
];

export default function App() {
  const [step, setStep] = useState(0); // 0=hero, 1-4=steps
  const [fileId, setFileId] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [config, setConfig] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [loading, setLoading] = useState(false);
  const [procStep, setProcStep] = useState(0);
  const stepsRef = useRef(null);
  const resultsRef = useRef(null);

  const scrollToSteps = () => {
    setTimeout(
      () =>
        stepsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      80,
    );
  };

  const handleUpload = useCallback(
    async (file) => {
      setLoading(true);
      setStatus({ type: "info", message: `Uploading ${file.name}…` });
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(`${API}/upload`, {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Upload failed");
        }
        const data = await res.json();
        setFileId(data.file_id);
        setFileName(data.filename);
        setStatus({
          type: "success",
          message: `${data.filename} uploaded successfully`,
        });

        if (!config) {
          const cfgRes = await fetch(`${API}/config/default`);
          if (cfgRes.ok) setConfig(await cfgRes.json());
        }
        if (step < 2) setStep(2); // advance to configure
      } catch (e) {
        setStatus({ type: "error", message: e.message });
      } finally {
        setLoading(false);
      }
    },
    [config, step],
  );

  const handleAnalyze = useCallback(async () => {
    if (!fileId) {
      setStatus({ type: "error", message: "Please upload a file first" });
      return;
    }
    if (!config) {
      setStatus({ type: "error", message: "Please configure analysis" });
      return;
    }

    setLoading(true);
    setResult(null);
    setStep(3);
    setProcStep(0);
    setStatus({ type: "info", message: "Running analysis pipeline…" });

    // Simulate step progress
    const timers = PROC_STEPS.map((_, i) =>
      setTimeout(() => setProcStep(i + 1), i * 900 + 400),
    );

    try {
      const res = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id: fileId, config }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Analysis failed");
      }
      const data = await res.json();
      timers.forEach(clearTimeout);
      setProcStep(PROC_STEPS.length + 1);
      setResult(data);
      setStatus({
        type: "success",
        message: `${data.analysis_name} — ${data.record_count} records`,
      });
      setTimeout(() => {
        setStep(4);
        setTimeout(
          () => resultsRef.current?.scrollIntoView({ behavior: "smooth" }),
          100,
        );
      }, 600);
    } catch (e) {
      timers.forEach(clearTimeout);
      setStatus({ type: "error", message: e.message });
      setStep(2);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [fileId, config]);

  const handleDownload = useCallback(() => {
    if (result?.result_id)
      window.open(`${API}/results/${result.result_id}/download`, "_blank");
  }, [result]);

  const goToStep = (s) => {
    if (s === 1 || (s === 2 && fileId) || (s === 4 && result)) setStep(s);
  };

  return (
    <>
      <div className="bg-canvas" />
      <div className="bg-grid" />

      <div className="app-shell">
        {/* ── Header ── */}
        <header className="app-header">
          <div className="header-inner">
            <div className="logo">
              <div className="logo-mark">
                <svg
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 14L6 8L10 11L14 4L16 6"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="6" cy="8" r="1.5" fill="white" opacity="0.7" />
                  <circle cx="10" cy="11" r="1.5" fill="white" opacity="0.7" />
                  <circle cx="14" cy="4" r="1.5" fill="white" opacity="0.7" />
                </svg>
              </div>
              <span className="logo-text">Macroscope</span>
            </div>
            <nav className="nav-items">
              {step > 0 && (
                <button
                  className="nav-pill"
                  onClick={() => {
                    setStep(0);
                    setResult(null);
                    setFileId(null);
                    setFileName(null);
                    setConfig(null);
                  }}
                >
                  Home
                </button>
              )}
              {step > 1 && fileId && (
                <button
                  className="nav-pill"
                  onClick={() => {
                    setResult(null);
                    setStep(2);
                    setTimeout(scrollToSteps, 100);
                  }}
                >
                  ← New Analysis
                </button>
              )}
              {result && (
                <button
                  className="nav-pill"
                  onClick={() => {
                    setStep(4);
                    setTimeout(
                      () =>
                        resultsRef.current?.scrollIntoView({
                          behavior: "smooth",
                        }),
                      100,
                    );
                  }}
                >
                  View Results
                </button>
              )}
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noreferrer"
                className="nav-pill"
              >
                API ↗
              </a>
              <div className="nav-status">
                <div className="status-dot" />
                <span>API Live</span>
              </div>
            </nav>
          </div>
        </header>

        {/* ── Hero (step 0) ── */}
        {step === 0 && (
          <section className="hero">
            <div className="hero-orb hero-orb-1" />
            <div className="hero-orb hero-orb-2" />

            <div className="hero-eyebrow fade-up">
              <div className="hero-eyebrow-dot" />
              World Economic Intelligence
            </div>

            <h1 className="hero-title fade-up delay-1">
              <span className="accent">Decode</span> Global GDP
              <span className="line2">In seconds, not spreadsheets</span>
            </h1>

            <p className="hero-desc fade-up delay-2">
              Upload any GDP dataset and instantly surface{" "}
              <strong>growth trends, continental rankings,</strong> and economic
              shifts — powered by a Python analysis engine and rendered as
              beautiful charts.
            </p>

            <div className="hero-cta fade-up delay-3">
              <button
                className="btn-primary"
                onClick={() => {
                  setStep(1);
                  setTimeout(scrollToSteps, 100);
                }}
              >
                <span>⚡</span> Start Analysis
              </button>
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
              >
                <span>📖</span> View API Docs
              </a>
            </div>

            <div className="hero-stats fade-up delay-4">
              <div className="hero-stat">
                <div className="hero-stat-val">8</div>
                <div className="hero-stat-label">Analysis Types</div>
              </div>
              <div className="hero-divider" />
              <div className="hero-stat">
                <div className="hero-stat-val">195</div>
                <div className="hero-stat-label">Countries</div>
              </div>
              <div className="hero-divider" />
              <div className="hero-stat">
                <div className="hero-stat-val">60+</div>
                <div className="hero-stat-label">Years of Data</div>
              </div>
            </div>
          </section>
        )}

        {/* ── Steps 1-4 ── */}
        {step > 0 && (
          <>
            <div ref={stepsRef} className="steps-bar">
              <div className="steps-track">
                {STEPS.map((s, i) => {
                  const isDone = step > s.id;
                  const isActive = step === s.id;
                  return (
                    <div key={s.id} style={{ display: "contents" }}>
                      {i > 0 && <div className="step-connector" />}
                      <div
                        className={`step-item ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
                        onClick={() => goToStep(s.id)}
                      >
                        <div className="step-num">{isDone ? "✓" : s.id}</div>
                        <div className="step-label">
                          <div>{s.label}</div>
                          <div className="step-sub">{s.sub}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <main className="main-content">
              {/* ── Step 1: Upload ── */}
              {step === 1 && (
                <div className="section-enter">
                  <div className="two-col">
                    <div className="card">
                      <div className="card-label">Step 01</div>
                      <div className="card-title">Upload Your Dataset</div>
                      <div className="card-desc">
                        Excel, CSV, or JSON — needs Country Name, Continent, and
                        year columns
                      </div>
                      <UploadZone
                        onFile={handleUpload}
                        uploaded={!!fileId}
                        fileName={fileName}
                        loading={loading}
                      />
                    </div>

                    <div
                      className="card"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 20,
                      }}
                    >
                      <div>
                        <div className="card-label">Format Guide</div>
                        <div className="card-title">Expected Structure</div>
                        <div className="card-desc">
                          Your file should have at minimum these columns:
                        </div>
                      </div>
                      <div
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          borderRadius: "var(--radius-sm)",
                          padding: "16px 20px",
                          fontFamily: "var(--mono)",
                          fontSize: 12,
                          color: "var(--text2)",
                          lineHeight: 2,
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div
                          style={{
                            color: "var(--text3)",
                            marginBottom: 8,
                            fontSize: 10,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                          }}
                        >
                          columns
                        </div>
                        <div>
                          <span style={{ color: "var(--gold)" }}>
                            Country Name
                          </span>{" "}
                          <span style={{ color: "var(--text3)" }}>
                            — string
                          </span>
                        </div>
                        <div>
                          <span style={{ color: "var(--blue2)" }}>
                            Continent
                          </span>{" "}
                          <span style={{ color: "var(--text3)" }}>
                            — Asia | Europe | Africa…
                          </span>
                        </div>
                        <div>
                          <span style={{ color: "var(--emerald)" }}>
                            2000, 2001…
                          </span>{" "}
                          <span style={{ color: "var(--text3)" }}>
                            — GDP values (USD)
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "14px 16px",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--gold-dim)",
                          border: "1px solid rgba(232,184,75,0.2)",
                          fontSize: 13,
                          color: "var(--text2)",
                        }}
                      >
                        💡 The included{" "}
                        <strong style={{ color: "var(--gold)" }}>
                          GDP.xlsx
                        </strong>{" "}
                        file in the repo is pre-formatted and ready to use.
                      </div>
                      {fileId && (
                        <button
                          className="btn-primary"
                          onClick={() => setStep(2)}
                          style={{ alignSelf: "flex-start" }}
                        >
                          Continue to Configure →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 2: Configure ── */}
              {step === 2 && (
                <div className="section-enter">
                  <div className="two-col">
                    <div className="card">
                      <div className="card-label">Step 02</div>
                      <div className="card-title">Choose Analysis</div>
                      <div className="card-desc">
                        Select one of 8 analysis functions
                      </div>
                      {config ? (
                        <div style={{ marginTop: 20 }}>
                          <ConfigEditor value={config} onChange={setConfig} />
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: "40px 20px",
                            textAlign: "center",
                            color: "var(--text3)",
                          }}
                        >
                          Upload a file first to load configuration
                        </div>
                      )}
                    </div>

                    <div
                      className="card"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 20,
                      }}
                    >
                      <div>
                        <div className="card-label">Step 03</div>
                        <div className="card-title">Run Analysis</div>
                        <div className="card-desc">
                          The Python engine will process your dataset and return
                          structured results with chart guidance.
                        </div>
                      </div>

                      {fileId && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "12px 16px",
                            borderRadius: "var(--radius-sm)",
                            background: "var(--emerald-dim)",
                            border: "1px solid rgba(16,185,129,0.2)",
                            fontSize: 13,
                            color: "var(--emerald)",
                          }}
                        >
                          <span>✅</span>
                          <span style={{ fontWeight: 600 }}>{fileName}</span>
                          <span
                            style={{
                              color: "rgba(16,185,129,0.6)",
                              marginLeft: "auto",
                            }}
                          >
                            ready
                          </span>
                        </div>
                      )}

                      {config && (
                        <div
                          style={{
                            padding: "12px 16px",
                            borderRadius: "var(--radius-sm)",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid var(--border)",
                            fontSize: 12,
                            fontFamily: "var(--mono)",
                            color: "var(--text2)",
                            lineHeight: 1.8,
                          }}
                        >
                          <div
                            style={{
                              color: "var(--text3)",
                              fontSize: 10,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              marginBottom: 8,
                            }}
                          >
                            active config
                          </div>
                          <div>
                            <span style={{ color: "var(--text3)" }}>
                              function:{" "}
                            </span>
                            <span style={{ color: "var(--gold)" }}>
                              #{config.FunctionOption}
                            </span>
                          </div>
                          {config.parameters?.YearRange && (
                            <div>
                              <span style={{ color: "var(--text3)" }}>
                                years:{" "}
                              </span>
                              <span style={{ color: "var(--blue2)" }}>
                                {config.parameters.YearRange.startYear}–
                                {config.parameters.YearRange.EndYear}
                              </span>
                            </div>
                          )}
                          {config.parameters?.continent && (
                            <div>
                              <span style={{ color: "var(--text3)" }}>
                                continent:{" "}
                              </span>
                              <span style={{ color: "var(--emerald)" }}>
                                {config.parameters.continent}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        className="analyze-btn"
                        onClick={handleAnalyze}
                        disabled={loading || !fileId}
                        style={{
                          alignSelf: "stretch",
                          justifyContent: "center",
                        }}
                      >
                        <span className="btn-shimmer" />
                        {loading ? (
                          <>
                            <span className="spinner" />
                            <span>Running…</span>
                          </>
                        ) : (
                          <>
                            <span>▶</span>
                            <span>Run Analysis</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 3: Processing ── */}
              {step === 3 && (
                <div className="processing-section section-enter">
                  <div className="processing-orb">
                    <div className="orb-ring orb-ring-1" />
                    <div className="orb-ring orb-ring-2" />
                    <div className="orb-ring orb-ring-3" />
                    <div className="orb-core">🌐</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div className="processing-title">Analyzing Dataset</div>
                    <div
                      style={{
                        color: "var(--text2)",
                        fontSize: 14,
                        marginTop: 6,
                      }}
                    >
                      Running Python analysis pipeline…
                    </div>
                  </div>
                  <div className="processing-steps">
                    {PROC_STEPS.map((s, i) => (
                      <div
                        key={i}
                        className={`proc-step ${procStep === i + 1 ? "active" : procStep > i + 1 ? "complete" : ""}`}
                      >
                        <div className="proc-dot" />
                        <span>{s}</span>
                        {procStep > i + 1 && (
                          <span style={{ marginLeft: "auto", fontSize: 12 }}>
                            ✓
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 4: Results ── */}
              {step === 4 && result && (
                <div ref={resultsRef} className="section-enter">
                  <ResultsDashboard
                    result={result}
                    onDownload={handleDownload}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 14,
                      marginTop: 32,
                    }}
                  >
                    <button
                      className="btn-ghost"
                      onClick={() => {
                        setStep(0);
                        setResult(null);
                        setFileId(null);
                        setFileName(null);
                        setConfig(null);
                      }}
                    >
                      Home
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => {
                        setResult(null);
                        setStep(2);
                        setTimeout(scrollToSteps, 100);
                      }}
                    >
                      ← New Analysis
                    </button>
                    <button className="btn-primary" onClick={handleDownload}>
                      ↓ Download CSV
                    </button>
                  </div>
                </div>
              )}
            </main>
          </>
        )}

        <footer className="app-footer">
          Macroscope — GDP Intelligence Platform &nbsp;·&nbsp; Python FastAPI +
          React &nbsp;·&nbsp;
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer">
            API Docs ↗
          </a>
        </footer>
      </div>

      <Toast status={status} loading={loading} />
    </>
  );
}

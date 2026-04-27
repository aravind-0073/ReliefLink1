import React, { useState, useCallback, useRef, useEffect } from "react";
import Papa from "papaparse";
import { submitBulkRequest, getBulkRequests, approveBulkRequest, rejectBulkRequest } from "../utils/api";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatDate } from "../utils/helpers";

const REQUIRED_COLUMNS = ["title", "category", "urgency", "location"];
const OPTIONAL_COLUMNS = ["description", "peopleAffected", "type", "familiesAffected"];
const VALID_CATEGORIES = ["food", "health", "disaster", "shelter", "education", "other"];
const VALID_URGENCIES = ["low", "medium", "high", "critical"];
const URGENCY_COLORS = { critical: "#ff3333", high: "#f43f5e", medium: "#facc15", low: "#34d399" };

const ORIGIN_TAGS = {
  admin:     { label: "Admin Upload",          color: "#a78bfa", bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.3)" },
  volunteer: { label: "Suggested by Volunteer",color: "#38bdf8", bg: "rgba(56,189,248,0.12)", border: "rgba(56,189,248,0.3)" },
  user:      { label: "Requested by User",     color: "#fb923c", bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.3)" },
};

const STATUS_STYLE = {
  pending:  { color: "#d97706", bg: "rgba(217,119,6,0.12)" },
  approved: { color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  rejected: { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

function validateRow(row) {
  const errors = [];
  for (const f of REQUIRED_COLUMNS) {
    if (!row[f] || String(row[f]).trim() === "") errors.push(`Missing: ${f}`);
  }
  if (row.category && !VALID_CATEGORIES.includes(String(row.category).toLowerCase()))
    errors.push(`Invalid category`);
  if (row.urgency && !VALID_URGENCIES.includes(String(row.urgency).toLowerCase()))
    errors.push(`Invalid urgency`);
  const p = Number(row.peopleAffected);
  if (row.peopleAffected !== undefined && row.peopleAffected !== "" && (isNaN(p) || p < 1))
    errors.push("peopleAffected must be ≥ 1");
  return errors;
}

export default function BulkUploadPage({ user }) {
  const isAdmin = user?.role === "admin";
  const fileInputRef = useRef(null);

  /* ── Upload state ── */
  const [file, setFile]           = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [rowErrors, setRowErrors]   = useState([]);
  const [parseError, setParseError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  /* ── Admin queue state ── */
  const [queue, setQueue]             = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [previewReq, setPreviewReq]   = useState(null);
  const [actioningId, setActioningId] = useState(null);

  const loadQueue = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setQueueLoading(true);
      const res = await getBulkRequests();
      setQueue(res.data.data || []);
    } catch { toast.error("Failed to load bulk queue"); }
    finally { setQueueLoading(false); }
  }, [isAdmin]);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  /* ── File handler ── */
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setSubmitted(false);
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setParseError("Only .csv files are accepted.");
      setFile(null); setParsedData([]); return;
    }
    setParseError(""); setFile(f);
    Papa.parse(f, {
      header: true, skipEmptyLines: true,
      complete: ({ data, meta }) => {
        const cols = (meta.fields || []).map(c => c.toLowerCase().trim());
        const missing = REQUIRED_COLUMNS.filter(c => !cols.includes(c));
        if (missing.length) {
          setParseError(`Missing required columns: ${missing.join(", ")}`);
          setParsedData([]); return;
        }
        const norm = data.map(row => {
          const r = {};
          Object.keys(row).forEach(k => { r[k.toLowerCase().trim()] = row[k]; });
          return r;
        });
        setParsedData(norm);
        setRowErrors(norm.map(validateRow));
      },
      error: (err) => { setParseError(`Parse error: ${err.message}`); setParsedData([]); },
    });
  };

  const resetUpload = () => {
    setFile(null); setParsedData([]); setParseError(""); setRowErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    const valid = parsedData.filter((_, i) => rowErrors[i]?.length === 0);
    if (!valid.length) { toast.error("No valid rows to submit."); return; }
    setSubmitting(true);
    try {
      const res = await submitBulkRequest({ fileName: file.name, parsedData: valid });
      toast.success(res.data.message);
      setSubmitted(true); resetUpload();
      if (isAdmin) loadQueue();
    } catch (err) { toast.error(err.response?.data?.message || "Submission failed."); }
    finally { setSubmitting(false); }
  };

  /* ── Admin actions ── */
  const handleApprove = async (id) => {
    setActioningId(id);
    try {
      const res = await approveBulkRequest(id);
      toast.success(res.data.message); await loadQueue(); setPreviewReq(null);
    } catch (err) { toast.error(err.response?.data?.message || "Approval failed."); }
    finally { setActioningId(null); }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Reject this bulk request?")) return;
    setActioningId(id);
    try {
      await rejectBulkRequest(id);
      toast.info("Rejected."); await loadQueue(); setPreviewReq(null);
    } catch { toast.error("Rejection failed."); }
    finally { setActioningId(null); }
  };

  const validCount   = rowErrors.filter(e => e.length === 0).length;
  const invalidCount = rowErrors.filter(e => e.length > 0).length;
  const pendingCount = queue.filter(r => r.status === "pending").length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", color: "var(--text-primary)" }}>
            📦 Bulk Need Upload
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>
            {isAdmin
              ? "Upload a CSV to instantly create needs, or review pending bulk requests."
              : "Upload a CSV of multiple needs. An admin will review before publishing."}
          </p>
        </div>
        {isAdmin && pendingCount > 0 && (
          <span style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800, background: "rgba(217,119,6,0.15)", color: "#d97706", border: "1px solid rgba(217,119,6,0.3)" }}>
            ⏳ {pendingCount} pending
          </span>
        )}
      </div>

      <div className="grid-2" style={{ marginBottom: 32, alignItems: "start" }}>
        {/* ── Left: Upload Card ── */}
        <div className="card">
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, color: "var(--text-primary)" }}>
            {isAdmin ? "Upload CSV (Auto-Approved)" : "Submit Bulk Request"}
          </h2>

          {/* Column guide */}
          <div style={{ padding: "12px 14px", background: "var(--accent-blue-dim)", borderRadius: 10, border: "1px solid rgba(59,130,246,0.2)", marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-blue)", marginBottom: 8, textTransform: "uppercase" }}>📋 Required & Optional Columns</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {REQUIRED_COLUMNS.map(c => (
                <span key={c} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)", fontWeight: 700 }}>{c} *</span>
              ))}
              {OPTIONAL_COLUMNS.map(c => (
                <span key={c} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "var(--bg-input)", color: "var(--text-muted)", border: "1px solid var(--border)", fontWeight: 600 }}>{c}</span>
              ))}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>
              category: {VALID_CATEGORIES.join(", ")} · urgency: {VALID_URGENCIES.join(", ")}
            </div>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${parseError ? "var(--urgency-critical)" : file ? "var(--accent-green)" : "var(--border)"}`,
              borderRadius: 12, padding: "32px 16px", textAlign: "center", cursor: "pointer",
              background: file ? "var(--accent-green-dim)" : parseError ? "var(--urgency-critical-bg)" : "var(--bg-input)",
              transition: "all 0.2s", marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>{parseError ? "❌" : file ? "✅" : "📂"}</div>
            {file
              ? <div style={{ fontWeight: 700, color: "var(--accent-green)", fontSize: 14 }}>{file.name}</div>
              : <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>Click to select a .csv file</div>}
            {parseError && <div style={{ marginTop: 10, fontSize: 12, color: "var(--urgency-critical)", fontWeight: 600 }}>{parseError}</div>}
            <input ref={fileInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />
          </div>

          {/* Summary badges */}
          {parsedData.length > 0 && (
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, padding: "10px 12px", background: "var(--accent-green-dim)", borderRadius: 8, border: "1px solid var(--accent-green-glow)" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent-green)" }}>{validCount}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Valid</div>
              </div>
              {invalidCount > 0 && (
                <div style={{ flex: 1, padding: "10px 12px", background: "var(--urgency-critical-bg)", borderRadius: 8, border: "1px solid var(--urgency-critical-border)" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--urgency-critical)" }}>{invalidCount}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Skipped</div>
                </div>
              )}
              <div style={{ flex: 1, padding: "10px 12px", background: "var(--bg-input)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{parsedData.length}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Total</div>
              </div>
            </div>
          )}

          {/* Actions */}
          {parsedData.length > 0 && validCount > 0 && (
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : isAdmin ? `🚀 Create ${validCount} Needs` : `📨 Submit ${validCount} Rows`}
              </button>
              <button className="btn btn-sm" onClick={resetUpload}>Clear</button>
            </div>
          )}

          {submitted && (
            <div style={{ marginTop: 16, padding: 16, background: "var(--accent-green-dim)", borderRadius: 10, border: "1px solid var(--accent-green-glow)", textAlign: "center" }}>
              <div style={{ fontWeight: 700, color: "var(--accent-green)" }}>
                {isAdmin ? "✅ Needs created successfully!" : "✅ Submitted for admin review!"}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Preview Table ── */}
        <div className="card" style={{ padding: parsedData.length ? 20 : 24 }}>
          {parsedData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 6 }}>No file selected yet.</p>
              <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Once you select a CSV, a preview of parsed rows will appear here.</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
                Row Preview ({parsedData.length} rows)
              </div>
              <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: 400, borderRadius: 8, border: "1px solid var(--border)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: "var(--bg-input)", position: "sticky", top: 0 }}>
                      <th style={TH}>#</th>
                      {["title", "category", "urgency", "location", "peopleAffected"].map(c => <th key={c} style={TH}>{c}</th>)}
                      <th style={TH}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((row, i) => {
                      const errs = rowErrors[i] || [];
                      const valid = errs.length === 0;
                      return (
                        <tr key={i} style={{ borderLeft: `3px solid ${valid ? "transparent" : "var(--urgency-critical)"}`, background: valid ? "transparent" : "rgba(239,68,68,0.03)" }}>
                          <td style={TD}>{i + 1}</td>
                          {["title", "category", "urgency", "location", "peopleAffected"].map(c => (
                            <td key={c} style={{ ...TD, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {c === "urgency" && row[c] ? (
                                <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 20, background: `${URGENCY_COLORS[row[c]?.toLowerCase()]}22`, color: URGENCY_COLORS[row[c]?.toLowerCase()] }}>
                                  {row[c]}
                                </span>
                              ) : row[c] || <span style={{ color: "var(--text-muted)" }}>—</span>}
                            </td>
                          ))}
                          <td style={TD}>
                            {valid
                              ? <span style={{ fontSize: 9, fontWeight: 800, color: "var(--accent-green)", background: "var(--accent-green-dim)", padding: "2px 6px", borderRadius: 20 }}>✓ Valid</span>
                              : <span title={errs.join(", ")} style={{ fontSize: 9, fontWeight: 800, color: "var(--urgency-critical)", background: "var(--urgency-critical-bg)", padding: "2px 6px", borderRadius: 20, cursor: "help" }}>✕ {errs[0]}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Admin: Bulk Request Queue ── */}
      {isAdmin && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Bulk Request Queue</h2>
            <button className="btn btn-sm" onClick={loadQueue} disabled={queueLoading}>{queueLoading ? "Loading..." : "🔄 Refresh"}</button>
          </div>

          {queueLoading && <LoadingSpinner message="Loading queue..." />}
          {!queueLoading && queue.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 14 }}>🌱 No bulk requests yet</div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {queue.map((req) => {
              const sc = STATUS_STYLE[req.status] || STATUS_STYLE.pending;
              const origin = ORIGIN_TAGS[req.uploadedByRole] || ORIGIN_TAGS.user;
              const isPending = req.status === "pending";
              const isExpanded = previewReq?.id === req.id;
              return (
                <div key={req.id} style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                  {/* Row header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>📄 {req.fileName}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: sc.bg, color: sc.color }}>{req.status.toUpperCase()}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: origin.bg, color: origin.color, border: `1px solid ${origin.border}` }}>{origin.label}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {req.parsedData?.length} rows · Submitted {formatDate(req.createdAt)}
                        {req.summary && ` · ${req.summary.created} created, ${req.summary.skipped} skipped`}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button className="btn btn-sm" onClick={() => setPreviewReq(isExpanded ? null : req)}>
                        {isExpanded ? "Hide" : "Preview"}
                      </button>
                      {isPending && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => handleApprove(req.id)} disabled={actioningId === req.id}>Approve</button>
                          <button className="btn btn-sm" style={{ color: "var(--urgency-critical)" }} onClick={() => handleReject(req.id)} disabled={actioningId === req.id}>Reject</button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded preview */}
                  {isExpanded && req.parsedData?.length > 0 && (
                    <div style={{ borderTop: "1px solid var(--border)", padding: 16 }}>
                      <div style={{ overflowX: "auto", maxHeight: 280, borderRadius: 8, border: "1px solid var(--border)" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                          <thead>
                            <tr style={{ background: "var(--bg-card)" }}>
                              {["#", "title", "category", "urgency", "location", "peopleAffected"].map(h => <th key={h} style={TH}>{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {req.parsedData.map((row, i) => (
                              <tr key={i}>
                                <td style={TD}>{i + 1}</td>
                                {["title", "category", "urgency", "location", "peopleAffected"].map(c => (
                                  <td key={c} style={{ ...TD, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {c === "urgency" && row[c] ? (
                                      <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 20, background: `${URGENCY_COLORS[row[c]?.toLowerCase()]}22`, color: URGENCY_COLORS[row[c]?.toLowerCase()] }}>{row[c]}</span>
                                    ) : row[c] || "—"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {isPending && (
                        <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleApprove(req.id)} disabled={actioningId === req.id}>
                            {actioningId === req.id ? "Processing..." : `✅ Approve & Create ${req.parsedData.length} Needs`}
                          </button>
                          <button className="btn btn-sm" style={{ color: "var(--urgency-critical)" }} onClick={() => handleReject(req.id)} disabled={actioningId === req.id}>❌ Reject</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const TH = { padding: "8px 10px", textAlign: "left", color: "var(--text-muted)", fontWeight: 700, borderBottom: "1px solid var(--border)", whiteSpace: "nowrap", fontSize: 10, textTransform: "uppercase" };
const TD = { padding: "7px 10px", color: "var(--text-primary)", borderBottom: "1px solid var(--border)" };

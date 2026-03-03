"use client";

import { useState, useEffect, useRef } from "react";

type JobStatus = {
  status: "queued" | "running" | "complete" | "failed" | "rejected";
  detail: string | Record<string, unknown> | null;
  mode?: "easy" | "hard";
  supervisor?: { safe: boolean; difficulty: string; reason: string };
};

export default function Home() {
  const [apiUrl, setApiUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [taskPrompt, setTaskPrompt] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll job status
  useEffect(() => {
    if (!jobId || !apiUrl) return;

    const poll = setInterval(async () => {
      try {
        const res = await fetch(`${apiUrl}/api/job/${jobId}`);
        const data = await res.json();
        setJob(data);
        if (data.status === "complete" || data.status === "failed" || data.status === "rejected") {
          clearInterval(poll);
        }
      } catch {
        // keep polling
      }
    }, 3000);

    pollRef.current = poll;
    return () => clearInterval(poll);
  }, [jobId, apiUrl]);

  async function trigger() {
    setError(null);
    setJob(null);
    setJobId(null);

    if (!apiUrl || !repoUrl || !taskPrompt) {
      setError("All fields are required.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${apiUrl}/api/trigger-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: repoUrl, task_prompt: taskPrompt }),
      });
      const data = await res.json();
      if (data.job_id) {
        setJobId(data.job_id);
        setJob({ status: "queued", detail: null });
      } else {
        setError(JSON.stringify(data));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSending(false);
    }
  }

  const statusColor: Record<string, string> = {
    queued: "#F0C75E",
    running: "#5B8DEF",
    complete: "#5EC69A",
    failed: "#E87D5F",
    rejected: "#E85F5F",
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 32 }}>Agent Tester</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#8A817A" }}>Worker URL</span>
          <input
            type="url"
            placeholder="https://your-service.onrender.com"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value.replace(/\/$/, ""))}
            style={inputStyle}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#8A817A" }}>Repository URL</span>
          <input
            type="url"
            placeholder="https://github.com/your-org/your-repo.git"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#8A817A" }}>Task Prompt</span>
          <textarea
            placeholder="Add a dark mode toggle to the settings page..."
            value={taskPrompt}
            onChange={(e) => setTaskPrompt(e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </label>

        <button onClick={trigger} disabled={sending} style={buttonStyle}>
          {sending ? "Sending..." : "Trigger Agent"}
        </button>

        {error && <p style={{ color: "#E87D5F", fontSize: 14, margin: 0 }}>{error}</p>}
      </div>

      {job && (
        <div style={{ marginTop: 32, padding: 20, background: "#1A1816", border: "1px solid #2A2520", borderRadius: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: statusColor[job.status] || "#8A817A",
                display: "inline-block",
                animation: job.status === "running" ? "pulse 1.5s infinite" : undefined,
              }}
            />
            <span style={{ fontSize: 15, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
              {job.status}
            </span>
            {jobId && (
              <span style={{ fontSize: 12, color: "#5A534D", marginLeft: "auto", fontFamily: "monospace" }}>
                {jobId.slice(0, 8)}
              </span>
            )}
          </div>

          {job.detail != null && (
            <pre
              style={{
                fontSize: 12,
                color: "#8A817A",
                background: "#131110",
                padding: 12,
                borderRadius: 8,
                overflow: "auto",
                maxHeight: 300,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                margin: 0,
              }}
            >
              {typeof job.detail === "string" ? job.detail : JSON.stringify(job.detail, null, 2)}
            </pre>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#131110",
  border: "1px solid #2A2520",
  borderRadius: 8,
  padding: "10px 14px",
  color: "#E8E0D4",
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
};

const buttonStyle: React.CSSProperties = {
  background: "#D4734E",
  color: "#fff",
  border: "none",
  borderRadius: 100,
  padding: "12px 0",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  marginTop: 8,
};

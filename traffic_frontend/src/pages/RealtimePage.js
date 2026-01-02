import React, { useEffect, useMemo, useRef, useState } from "react";
import { connectRealtimeRates } from "../api/realtime";
import { Button, Card, InlineError } from "../components/ui";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

function toPoint(message) {
  // Support common backend payload shapes:
  // {ts, upload_bps, download_bps} or {timestamp, up, down} etc.
  const now = Date.now();
  const ts = message?.ts || message?.timestamp || message?.time || now;
  const upload =
    message?.upload_bps ??
    message?.upload ??
    message?.up_bps ??
    message?.up ??
    message?.tx_bps ??
    0;
  const download =
    message?.download_bps ??
    message?.download ??
    message?.down_bps ??
    message?.down ??
    message?.rx_bps ??
    0;

  const t = typeof ts === "number" ? ts : Date.parse(ts) || now;
  return {
    t,
    time: new Date(t).toLocaleTimeString(),
    upload,
    download
  };
}

function humanBps(bps) {
  const n = Number(bps || 0);
  if (n < 1000) return `${n.toFixed(0)} bps`;
  if (n < 1e6) return `${(n / 1e3).toFixed(1)} Kbps`;
  if (n < 1e9) return `${(n / 1e6).toFixed(1)} Mbps`;
  return `${(n / 1e9).toFixed(1)} Gbps`;
}

// PUBLIC_INTERFACE
export function RealtimePage({ selectedModemId }) {
  /** Realtime chart screen using WebSocket stream. */
  const [error, setError] = useState("");
  const [status, setStatus] = useState("disconnected"); // disconnected | connecting | connected
  const [points, setPoints] = useState([]);

  const connRef = useRef(null);

  const canConnect = Boolean(selectedModemId);

  useEffect(() => {
    setError("");
    setPoints([]);

    if (!canConnect) {
      setStatus("disconnected");
      return;
    }

    setStatus("connecting");

    connRef.current = connectRealtimeRates({
      modemId: selectedModemId,
      onOpen: () => setStatus("connected"),
      onError: () => setError("Realtime connection error (check backend WS endpoint/CORS)."),
      onClose: () => setStatus("disconnected"),
      onMessage: (msg) => {
        const p = toPoint(msg);
        setPoints((prev) => {
          const next = [...prev, p];
          // keep last ~120 points (~2 minutes at 1Hz), resilient to different rates.
          return next.slice(-120);
        });
      }
    });

    return () => {
      try {
        connRef.current && connRef.current.close();
      } finally {
        connRef.current = null;
      }
    };
  }, [canConnect, selectedModemId]);

  const latest = useMemo(() => (points.length ? points[points.length - 1] : null), [points]);

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Realtime</h1>
          <p className="page-subtitle">Live upload/download rates for the selected modem (WebSocket stream).</p>
        </div>
        <div className="page-actions">
          <span className={`status status-${status}`}>{status}</span>
          <Button
            variant="ghost"
            onClick={() => {
              // quick reset of chart points
              setPoints([]);
              setError("");
            }}
            disabled={!canConnect}
          >
            Clear
          </Button>
        </div>
      </div>

      {!selectedModemId ? (
        <div className="empty big">Select a modem in the sidebar to view realtime rates.</div>
      ) : null}

      <InlineError message={error} />

      <div className="grid-1">
        <Card
          title="Upload / Download rate"
          subtitle={latest ? `Latest: ↑ ${humanBps(latest.upload)}  ↓ ${humanBps(latest.download)}` : "Waiting for samples..."}
        >
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={points}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" minTickGap={24} />
                <YAxis tickFormatter={(v) => humanBps(v)} width={90} />
                <Tooltip formatter={(v) => humanBps(v)} />
                <Legend />
                <Line type="monotone" dataKey="download" name="Download" stroke="var(--secondary)" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="upload" name="Upload" stroke="var(--primary)" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="muted small" style={{ marginTop: 12 }}>
            WebSocket endpoint is expected at <span className="mono">/ws/realtime</span> (query or path modem id supported).
          </div>
        </Card>
      </div>
    </div>
  );
}

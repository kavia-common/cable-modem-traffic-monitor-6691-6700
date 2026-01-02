import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { Button, Card, InlineError, Select, LoadingBar } from "../components/ui";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

function normalizeSeries(payload) {
  // Accept common formats:
  // 1) { series: [{ts, upload_bytes, download_bytes}...] }
  // 2) [{timestamp,...}]
  // 3) {points:[{timestamp, up_bps, down_bps}]}
  const raw = payload?.series || payload?.points || payload || [];
  const arr = Array.isArray(raw) ? raw : [];

  return arr
    .map((p) => {
      const ts = p.ts || p.timestamp || p.time;
      const t = typeof ts === "number" ? ts : Date.parse(ts || "") || Date.now();

      // Support bytes-oriented payloads and bps-oriented payloads (backend stats returns bps).
      const up =
        p.upload_bytes ??
        p.up_bytes ??
        p.upload ??
        p.up ??
        p.tx_bytes ??
        p.up_bps ??
        0;

      const down =
        p.download_bytes ??
        p.down_bytes ??
        p.download ??
        p.down ??
        p.rx_bytes ??
        p.down_bps ??
        0;

      return {
        t,
        time: new Date(t).toLocaleString(),
        uploadBytes: Number(up) || 0,
        downloadBytes: Number(down) || 0
      };
    })
    .sort((a, b) => a.t - b.t);
}

function humanBytes(n) {
  const v = Number(n || 0);
  if (v < 1024) return `${v.toFixed(0)} B`;
  if (v < 1024 ** 2) return `${(v / 1024).toFixed(1)} KB`;
  if (v < 1024 ** 3) return `${(v / 1024 ** 2).toFixed(1)} MB`;
  return `${(v / 1024 ** 3).toFixed(1)} GB`;
}

// PUBLIC_INTERFACE
export function HistoryPage({ selectedModemId }) {
  /** Historical traffic charts with selectable time ranges. */
  const [range, setRange] = useState("hour"); // hour | day | week
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);

  const canLoad = Boolean(selectedModemId);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!canLoad) {
        setPayload(null);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await api.getHistoricalTraffic({ modemId: selectedModemId, range });
        if (!cancelled) setPayload(res);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load history.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [canLoad, selectedModemId, range]);

  const series = useMemo(() => normalizeSeries(payload), [payload]);

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">History</h1>
          <p className="page-subtitle">Historical traffic totals over selectable ranges.</p>
        </div>
        <div className="page-actions">
          <Select label="Range" value={range} onChange={(e) => setRange(e.target.value)} disabled={!canLoad || loading}>
            <option value="hour">Last hour</option>
            <option value="day">Last day</option>
            <option value="week">Last week</option>
          </Select>
          <Button variant="ghost" disabled={!canLoad || loading} onClick={() => setPayload(null)}>
            Reset
          </Button>
        </div>
      </div>

      {!selectedModemId ? (
        <div className="empty big">Select a modem in the sidebar to view historical charts.</div>
      ) : null}

      <InlineError message={error} />

      <Card
        title="Traffic totals (bytes)"
        subtitle={selectedModemId ? `Modem: ${selectedModemId} • Range: ${range}` : "No modem selected"}
        actions={loading ? <LoadingBar label="Loading..." /> : null}
      >
        {loading ? <div style={{ height: 320 }} /> : null}
        {!loading && series.length === 0 ? <div className="empty">No data returned for this range.</div> : null}

        {!loading && series.length > 0 ? (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" minTickGap={24} />
                <YAxis tickFormatter={(v) => humanBytes(v)} width={90} />
                <Tooltip formatter={(v) => humanBytes(v)} />
                <Legend />
                <Area type="monotone" dataKey="downloadBytes" name="Download" stroke="var(--secondary)" fill="var(--secondarySoft)" fillOpacity={1} />
                <Area type="monotone" dataKey="uploadBytes" name="Upload" stroke="var(--primary)" fill="var(--primarySoft)" fillOpacity={1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : null}

        <div className="muted small" style={{ marginTop: 12 }}>
          Endpoint expected at <span className="mono">/api/modems/&lt;id&gt;/traffic/history?range=hour|day|week</span>. If backend differs, adjust <span className="mono">src/api/client.js</span>.
        </div>
      </Card>
    </div>
  );
}

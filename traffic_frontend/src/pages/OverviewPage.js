import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui";

// PUBLIC_INTERFACE
export function OverviewPage({ modems, selectedModemId }) {
  /** Overview landing page. */
  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-subtitle">Quick access to modem management, realtime monitoring, and history.</p>
        </div>
      </div>

      <div className="grid-2">
        <Card title="Configured modems" subtitle={`${modems.length} total`}>
          <div className="big-number">{modems.length}</div>
          <div className="muted">
            Manage your modems in <Link to="/modems">Modems</Link>.
          </div>
        </Card>

        <Card title="Selected modem" subtitle="Current selection from sidebar">
          <div className="big-number mono">{selectedModemId || "—"}</div>
          <div className="muted">
            View <Link to="/realtime">Realtime</Link> or <Link to="/history">History</Link> for this modem.
          </div>
        </Card>
      </div>

      <Card title="Getting started" subtitle="Recommended flow">
        <ol className="list">
          <li>
            Add one or more modems in <strong>Modems</strong>.
          </li>
          <li>
            Pick a modem in the sidebar selector.
          </li>
          <li>
            Watch live rates in <strong>Realtime</strong> and view totals in <strong>History</strong>.
          </li>
        </ol>
      </Card>
    </div>
  );
}

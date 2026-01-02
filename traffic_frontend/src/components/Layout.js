import React from "react";
import { NavLink } from "react-router-dom";
import { Select } from "./ui";

// PUBLIC_INTERFACE
export function Layout({
  modems,
  selectedModemId,
  onSelectModem,
  children
}) {
  /** Main dashboard layout with header + sidebar + content. */
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">CM</div>
          <div className="brand-text">
            <div className="brand-title">Cable Modem Traffic Monitor</div>
            <div className="brand-subtitle">Ocean Professional Dashboard</div>
          </div>
        </div>

        <div className="header-actions">
          <span className="pill" title="Backend base URL is env-configurable via REACT_APP_BACKEND_BASE_URL">
            Backend: {process.env.REACT_APP_BACKEND_BASE_URL || "http://localhost:3001"}
          </span>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <div className="sidebar-block">
            <div className="sidebar-title">Modem</div>
            <Select
              label="Selected modem"
              value={selectedModemId || ""}
              onChange={(e) => onSelectModem(e.target.value)}
            >
              <option value="" disabled>
                {modems.length ? "Choose a modem..." : "No modems yet"}
              </option>
              {modems.map((m) => (
                <option key={m.id || m.modem_id || m.name} value={m.id || m.modem_id || m.name}>
                  {m.name || m.label || (m.id || m.modem_id)}
                </option>
              ))}
            </Select>
          </div>

          <nav className="nav">
            <NavLink className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} to="/">
              Overview
            </NavLink>
            <NavLink className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} to="/modems">
              Modems
            </NavLink>
            <NavLink className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} to="/realtime">
              Realtime
            </NavLink>
            <NavLink className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} to="/history">
              History
            </NavLink>
          </nav>

          <div className="sidebar-footer">
            <div className="hint">
              Tip: Add modems in <strong>Modems</strong>, then view <strong>Realtime</strong> and <strong>History</strong>.
            </div>
          </div>
        </aside>

        <main className="main">
          <div className="main-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}

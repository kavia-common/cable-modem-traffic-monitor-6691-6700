import React, { useMemo, useState } from "react";
import { api } from "../api/client";
import { Button, Card, InlineError, Input, LoadingBar } from "../components/ui";

function normalizeModemForForm(modem) {
  return {
    id: modem?.id || modem?.modem_id || "",
    name: modem?.name || modem?.label || "",
    host: modem?.host || modem?.ip || modem?.address || "",
    note: modem?.note || ""
  };
}

// PUBLIC_INTERFACE
export function ModemsPage({ modems, refreshModems, onAfterChange }) {
  /** Modem CRUD management screen. */
  const [mode, setMode] = useState("create"); // create | edit
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({ id: "", name: "", host: "", note: "" });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selectedModem = useMemo(
    () => modems.find((m) => (m.id || m.modem_id || m.name) === selectedId),
    [modems, selectedId]
  );

  const startCreate = () => {
    setMode("create");
    setSelectedId("");
    setForm({ id: "", name: "", host: "", note: "" });
    setError("");
  };

  const startEdit = (m) => {
    setMode("edit");
    const normalized = normalizeModemForForm(m);
    setSelectedId(normalized.id || (m.id || m.modem_id || m.name));
    setForm(normalized);
    setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const payload = {
      // keep flexible: backend may accept id/name/host fields
      id: form.id || undefined,
      name: form.name || undefined,
      host: form.host || undefined,
      note: form.note || undefined
    };

    if (!payload.name && !payload.id) {
      setError("Please provide at least a Name or ID.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "create") {
        await api.createModem(payload);
      } else {
        const id = selectedId || form.id;
        if (!id) throw new Error("Missing modem id for update.");
        await api.updateModem(id, payload);
      }
      await refreshModems();
      onAfterChange && onAfterChange();
      startCreate();
    } catch (err) {
      setError(err.message || "Failed to save modem.");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (m) => {
    const id = m.id || m.modem_id || m.name;
    if (!id) return;

    const ok = window.confirm(`Remove modem "${m.name || id}"?`);
    if (!ok) return;

    setBusy(true);
    setError("");
    try {
      await api.deleteModem(id);
      await refreshModems();
      onAfterChange && onAfterChange();
      if (selectedId === id) startCreate();
    } catch (err) {
      setError(err.message || "Failed to delete modem.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Modems</h1>
          <p className="page-subtitle">Add, edit, or remove modems you want to monitor.</p>
        </div>
        <div className="page-actions">
          <Button variant="secondary" onClick={startCreate} disabled={busy}>
            New Modem
          </Button>
        </div>
      </div>

      <InlineError message={error} />

      <div className="grid-2">
        <Card
          title="Configured modems"
          subtitle={modems.length ? `${modems.length} modem(s)` : "No modems configured yet"}
        >
          {busy && modems.length === 0 ? <LoadingBar label="Loading modems..." /> : null}
          <div className="table">
            <div className="table-head">
              <div>Name</div>
              <div>Host</div>
              <div className="table-actions-col">Actions</div>
            </div>
            {modems.map((m) => {
              const id = m.id || m.modem_id || m.name;
              return (
                <div key={id} className={`table-row ${selectedId === id ? "selected" : ""}`}>
                  <div className="mono">{m.name || m.label || id}</div>
                  <div className="mono muted">{m.host || m.ip || m.address || "-"}</div>
                  <div className="table-actions">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(m)} disabled={busy}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => onDelete(m)} disabled={busy}>
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
            {modems.length === 0 ? <div className="empty">No modems yet. Create one to begin.</div> : null}
          </div>
        </Card>

        <Card
          title={mode === "create" ? "Add modem" : "Edit modem"}
          subtitle={mode === "edit" && selectedModem ? `Editing: ${selectedModem.name || selectedId}` : "Configuration details"}
        >
          <form className="form" onSubmit={onSubmit}>
            <Input
              label="ID (optional)"
              placeholder="e.g., modem-1"
              value={form.id}
              onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
              disabled={busy || mode === "edit"}
            />
            <Input
              label="Name"
              placeholder="e.g., Living Room Modem"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              disabled={busy}
            />
            <Input
              label="Host / IP"
              placeholder="e.g., 192.168.100.1"
              value={form.host}
              onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))}
              disabled={busy}
            />
            <Input
              label="Note"
              placeholder="Optional"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              disabled={busy}
            />

            <div className="form-actions">
              <Button type="submit" disabled={busy}>
                {busy ? "Saving..." : (mode === "create" ? "Add modem" : "Save changes")}
              </Button>
              {mode === "edit" ? (
                <Button type="button" variant="ghost" onClick={startCreate} disabled={busy}>
                  Cancel
                </Button>
              ) : null}
            </div>

            <div className="muted small">
              Note: field names are sent as <span className="mono">id</span>, <span className="mono">name</span>, <span className="mono">host</span>, <span className="mono">note</span>.
              If your backend expects different names, we can map them in the API client.
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

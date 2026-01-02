import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { api } from "./api/client";
import { Layout } from "./components/Layout";
import { InlineError, LoadingBar } from "./components/ui";
import { ModemsPage } from "./pages/ModemsPage";
import { RealtimePage } from "./pages/RealtimePage";
import { HistoryPage } from "./pages/HistoryPage";
import { OverviewPage } from "./pages/OverviewPage";

// PUBLIC_INTERFACE
function App() {
  /** App entry component: loads modems, provides selection state, and renders dashboard routes. */
  const [modems, setModems] = useState([]);
  const [selectedModemId, setSelectedModemId] = useState("");
  const [loadingModems, setLoadingModems] = useState(true);
  const [error, setError] = useState("");

  const refreshModems = useCallback(async () => {
    setError("");
    setLoadingModems(true);
    try {
      const list = await api.listModems();
      const arr = Array.isArray(list) ? list : (list?.items || list?.modems || []);
      setModems(arr);

      // Keep selection stable when possible, otherwise choose first modem.
      const ids = arr.map((m) => m.id || m.modem_id || m.name).filter(Boolean);
      setSelectedModemId((prev) => (prev && ids.includes(prev) ? prev : (ids[0] || "")));
    } catch (err) {
      setError(err.message || "Failed to load modems.");
    } finally {
      setLoadingModems(false);
    }
  }, []);

  useEffect(() => {
    refreshModems();
  }, [refreshModems]);

  const layoutModems = useMemo(() => modems || [], [modems]);

  return (
    <BrowserRouter>
      <Layout
        modems={layoutModems}
        selectedModemId={selectedModemId}
        onSelectModem={(id) => setSelectedModemId(id)}
      >
        {error ? <InlineError message={error} /> : null}
        {loadingModems ? <LoadingBar label="Loading modems..." /> : null}

        <Routes>
          <Route path="/" element={<OverviewPage modems={layoutModems} selectedModemId={selectedModemId} />} />
          <Route
            path="/modems"
            element={
              <ModemsPage
                modems={layoutModems}
                refreshModems={refreshModems}
                onAfterChange={() => {
                  // Modem list changed; selection is reconciled in refreshModems().
                }}
              />
            }
          />
          <Route path="/realtime" element={<RealtimePage selectedModemId={selectedModemId} />} />
          <Route path="/history" element={<HistoryPage selectedModemId={selectedModemId} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

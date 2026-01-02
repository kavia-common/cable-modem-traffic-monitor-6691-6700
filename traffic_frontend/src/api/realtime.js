import { getBackendBaseUrl } from "../config";

/**
 * Convert http(s) base URL to ws(s).
 */
function toWebSocketUrl(baseUrl) {
  const url = new URL(baseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString().replace(/\/+$/, "");
}

// PUBLIC_INTERFACE
export function connectRealtimeRates({ modemId, onMessage, onOpen, onError, onClose }) {
  /**
   * Connect to backend realtime WebSocket for a modem.
   * Expects backend endpoint to accept modemId in path or query; we support both common patterns.
   *
   * Returns: { close() }
   */
  const wsBase = toWebSocketUrl(getBackendBaseUrl());

  // Backend endpoint: /modems/{id}/realtime
  // Keep a fallback attempt for alternate patterns if deployments differ.
  const tryUrls = [
    `${wsBase}/modems/${encodeURIComponent(modemId)}/realtime`,
    `${wsBase}/ws/realtime?modem_id=${encodeURIComponent(modemId)}`
  ];

  let ws = null;
  let opened = false;

  // Attempt first URL; if it fails to connect quickly, fallback is handled by onerror -> second attempt.
  let attemptIndex = 0;

  const openAttempt = () => {
    ws = new WebSocket(tryUrls[attemptIndex]);

    ws.onopen = () => {
      opened = true;
      onOpen && onOpen();
    };

    ws.onerror = (evt) => {
      onError && onError(evt);
      // If it hasn't opened and we have a fallback URL, try it once.
      if (!opened && attemptIndex === 0) {
        attemptIndex = 1;
        try {
          ws.close();
        } catch {
          // ignore
        }
        openAttempt();
      }
    };

    ws.onclose = (evt) => {
      onClose && onClose(evt);
    };

    ws.onmessage = (evt) => {
      // Backend may send JSON or text; try JSON first.
      let payload = evt.data;
      try {
        payload = JSON.parse(evt.data);
      } catch {
        // keep as string
      }
      onMessage && onMessage(payload);
    };
  };

  openAttempt();

  return {
    close() {
      try {
        ws && ws.close();
      } catch {
        // ignore
      }
    }
  };
}

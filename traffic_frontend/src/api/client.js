import { getBackendBaseUrl } from "../config";

/**
 * Minimal fetch wrapper with JSON parsing + HTTP error normalization.
 */
async function request(path, { method = "GET", body, headers } = {}) {
  const baseUrl = getBackendBaseUrl();
  const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(headers || {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    let errorPayload = undefined;
    try {
      errorPayload = isJson ? await res.json() : await res.text();
    } catch (e) {
      // ignore parsing failure
    }
    const message =
      (errorPayload && typeof errorPayload === "object" && errorPayload.detail) ||
      (typeof errorPayload === "string" && errorPayload) ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.payload = errorPayload;
    throw err;
  }

  if (res.status === 204) return null;
  return isJson ? res.json() : res.text();
}

// PUBLIC_INTERFACE
export const api = {
  /** CRUD for modems */
  async listModems() {
    return request("/api/modems");
  },
  async createModem(modem) {
    return request("/api/modems", { method: "POST", body: modem });
  },
  async updateModem(modemId, modem) {
    return request(`/api/modems/${encodeURIComponent(modemId)}`, { method: "PUT", body: modem });
  },
  async deleteModem(modemId) {
    return request(`/api/modems/${encodeURIComponent(modemId)}`, { method: "DELETE" });
  },

  /** Historical stats (backend contract may vary slightly; we support common query patterns). */
  async getHistoricalTraffic({ modemId, range }) {
    // Try to align with typical "range" param usage.
    // If backend expects different params (start/end), the UI can be adapted without touching components.
    const qs = new URLSearchParams();
    if (range) qs.set("range", range);
    return request(`/api/modems/${encodeURIComponent(modemId)}/traffic/history?${qs.toString()}`);
  }
};

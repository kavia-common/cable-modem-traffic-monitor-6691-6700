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
  /** CRUD for modems (FastAPI backend routes are rooted at /modems). */
  async listModems() {
    return request("/modems");
  },
  async createModem(modem) {
    // Backend expects {name, ip, status}; UI may pass {host}. Map host->ip.
    const payload = { ...modem };
    if (!payload.ip && payload.host) payload.ip = payload.host;
    delete payload.host;
    return request("/modems", { method: "POST", body: payload });
  },
  async updateModem(modemId, modem) {
    const payload = { ...modem };
    if (!payload.ip && payload.host) payload.ip = payload.host;
    delete payload.host;
    return request(`/modems/${encodeURIComponent(modemId)}`, { method: "PUT", body: payload });
  },
  async deleteModem(modemId) {
    return request(`/modems/${encodeURIComponent(modemId)}`, { method: "DELETE" });
  },

  /**
   * Historical aggregated stats.
   * Backend contract: GET /modems/{id}/stats?from=ISO&to=ISO&granularity=1m|5m|1h
   *
   * UI range mapping:
   * - hour -> last 1 hour, 1m buckets
   * - day  -> last 24 hours, 5m buckets
   * - week -> last 7 days, 1h buckets
   */
  async getHistoricalTraffic({ modemId, range }) {
    const now = new Date();
    const to = now.toISOString();

    let fromDate = new Date(now.getTime() - 60 * 60 * 1000);
    let granularity = "1m";

    if (range === "day") {
      fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      granularity = "5m";
    } else if (range === "week") {
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      granularity = "1h";
    }

    const qs = new URLSearchParams();
    qs.set("from", fromDate.toISOString());
    qs.set("to", to);
    qs.set("granularity", granularity);

    return request(`/modems/${encodeURIComponent(modemId)}/stats?${qs.toString()}`);
  }
};

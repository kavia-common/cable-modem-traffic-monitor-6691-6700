/**
 * Application configuration.
 * Create React App exposes environment variables prefixed with REACT_APP_.
 */

export const DEFAULT_BACKEND_BASE_URL = "http://localhost:3001";

// PUBLIC_INTERFACE
export function getBackendBaseUrl() {
  /** Returns backend base URL from env or default fallback. */
  const fromEnv = process.env.REACT_APP_BACKEND_BASE_URL;
  return (fromEnv && fromEnv.trim()) ? fromEnv.trim().replace(/\/+$/, "") : DEFAULT_BACKEND_BASE_URL;
}

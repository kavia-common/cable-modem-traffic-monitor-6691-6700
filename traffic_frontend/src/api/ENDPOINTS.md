# Frontend ↔ Backend endpoint mapping

## Base URL
- Frontend reads `REACT_APP_BACKEND_BASE_URL`
- Fallback: `http://localhost:3001`

## REST
- List modems: `GET /modems`
- Create modem: `POST /modems` (expects `{name, ip, status?}`)
- Update modem: `PUT /modems/{id}`
- Delete modem: `DELETE /modems/{id}`

## Realtime (WebSocket)
- `WS /modems/{id}/realtime`
  - Message example: `{ "timestamp": "...", "up_bps": 123, "down_bps": 456 }`

## Historical stats
- `GET /modems/{id}/stats?from=ISO8601&to=ISO8601&granularity=1m|5m|1h`
  - Response example: `{ modem_id, granularity, from_ts, to_ts, points: [{timestamp, up_bps, down_bps}] }`

# Week 1 contract - HTTP baseline and temporary Socket.IO spike

## Implemented locally

Base URL: `http://127.0.0.1:3000`, replacing the port if configured. No `/api` prefix, authentication, database, or request body is needed.

### GET /health

HTTP `200`; `Content-Type: application/json; charset=utf-8`.

```json
{
  "status": "ok",
  "service": "travelbuddy-api"
}
```

This is a process health check only. It makes no claim about database, email, mobile, or deployment readiness.

### Unknown endpoints

Unmatched methods and paths, after any successful body parsing, return HTTP `404` with the same JSON shape:

```json
{
  "error": "not_found"
}
```

For example, `GET /does-not-exist` or `POST /health` returns 404. Express also provides its normal HEAD handling for GET routes; HEAD responses have no body. The fallback must remain after the implemented routes.

### JSON parsing and request errors

The global `express.json()` middleware runs before routes. Requests with `Content-Type: application/json` are parsed into `req.body`, with Express's default 100 KB limit and strict object/array mode. Parsing provides data, not field/type/business validation. There are no permanent POST or echo endpoints.

| Condition | HTTP status | JSON body |
| --- | --- | --- |
| Malformed JSON (including strict-mode rejection of scalar JSON) | 400 | `{"error":"invalid_json"}` |
| JSON body above the parser limit | 413 | `{"error":"payload_too_large"}` |
| Other client request errors | Error's 4xx status | `{"error":"bad_request"}` |
| Unexpected request error | 500 | `{"error":"internal_error"}` |

Parser errors occur before route lookup, so invalid JSON can produce 400 on an otherwise unknown endpoint. The final error handler logs only a status and fixed category; it does not expose request bodies, secrets, error messages, or stacks in JSON responses. An occupied port logs the port and system error code and exits unsuccessfully. Normal startup logs the local address. Ctrl+C stops the process; run `npm start` again to restart.

## Configuration

`PORT` is optional locally, defaults to `3000`, and must be a decimal integer from 1 to 65535. The start command loads `server/.env` if present, using Node's built-in loader. Environment variables take precedence. On Render, use the platform's supplied `PORT`. The server binds to `0.0.0.0` so the hosting network can reach it. Local clients still use `127.0.0.1`; public clients use the actual assigned HTTPS URL. The response shapes are unchanged.

## Future plans - not implemented or verified

The broader project proposes database storage, email OTP authentication, trip creation and matching, join requests, and participant chat. Production chat and mobile app integration remain future work. The temporary events below provide connectivity evidence only.

## Day 2 deployed contract

The same health and JSON 404 shapes are verified at `https://travelbuddy-api-uvpg.onrender.com`, with no path prefix. Public `/health` returned HTTP 200 and the exact specified body; an unknown path returned HTTP 404 and the specified fallback. Render confirms source `78499d04f0b8b05d564e9e2090c54e46107242fb` is live. Shreya confirmed phone access over mobile data. Free-tier sleeping can delay the first request; this is not an availability guarantee. See results for observed timing and the provider log-retrieval limitation.

Planning rules from the proposal: joining initially creates a pending request; creator acceptance grants participation and consumes a seat. Trip times are intended to use absolute UTC timestamps, displayed in Asia/Kolkata. These are future product rules, not behavior of this server.

Shreya confirmed the working test mailbox domain as `chitkara.edu.in`. This is user-confirmed mailbox information, not an implemented allowlist or proof of current enrollment. Actual OTP delivery and the complete domain policy remain to be tested/agreed.

## Temporary Socket.IO spike - 2026-11-07

One HTTP server and existing `PORT`; base `https://travelbuddy-api-uvpg.onrender.com`, path `/socket.io/`, namespace `/`. Compatible server/client major 4; tested package versions 4.8.4. Enabled only by exact string `SOCKET_SPIKE_ENABLED=true` at process startup. Otherwise no Socket.IO server/handshake or spike handlers are registered. Ordinary HTTP health/404 behavior remains unchanged when toggled.

| Event | Direction and recipients | Payload / behavior |
| --- | --- | --- |
| `spike:echo` | Client -> server | Object with `messageId` and `text` |
| `spike:echo:reply` | Server -> sender only | Validated, trimmed `{messageId, text}` |
| `spike:message` | Server -> all other connected spike clients | Same validated payload; sender excluded |
| `spike:error` | Server -> invalid sender only | `{"error":"invalid_payload","message":"Expected messageId (1-80) and text (1-500) as nonempty strings."}`; no reply/broadcast |

Reject null, arrays, primitives, missing/non-string fields, whitespace-only fields, raw messageId over 80 or text over 500 UTF-16 code units. Both fields must have at least one non-whitespace character. Trim leading/trailing whitespace on accepted fields. Construct a fresh payload with only `messageId` and `text`; ignore extra input fields. No timestamp, identity, room, or persistence is implied. Duplicate IDs are not deduplicated. Disconnected clients miss broadcasts.

Example: `{"messageId":"test-001","text":"Hello from phone A"}`. The sender gets `spike:echo:reply` and other connected clients get `spike:message`. This is public test broadcasting, with no authentication or private chat. CORS does not authenticate clients.

The Node check runs from `server/` with `npm ci --include=dev` followed by `npm run spike:check -- <base-url>`; add `--disabled` for disabled checks. It forces WebSocket, prints observed transports, and uses timeouts/connection cleanup. Negative event observations are bounded to 750 ms. Physical-phone routing remains pending evidence from Suryansh; no mobile files are included.

# Week 1 contract - Day 1 implemented subset

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

`PORT` is optional, defaults to `3000`, and must be a decimal integer from 1 to 65535. The start command loads `server/.env` if present, using Node's built-in loader. Terminal environment variables take precedence. The server listens on `127.0.0.1` for local checks only.

## Future plans - not implemented or verified

The broader project proposes database storage, email OTP authentication, trip creation and matching, join requests, and participant chat. Deployment, Socket.IO, and mobile device connectivity also remain future work. There are no usable endpoints or socket events for them yet; payloads must be agreed before implementation.

Planning rules from the proposal: joining initially creates a pending request; creator acceptance grants participation and consumes a seat. Trip times are intended to use absolute UTC timestamps, displayed in Asia/Kolkata. These are future product rules, not behavior of this server.

Shreya confirmed the working test mailbox domain as `chitkara.edu.in`. This is user-confirmed mailbox information, not an implemented allowlist or proof of current enrollment. Actual OTP delivery and the complete domain policy remain to be tested/agreed.

# TravelBuddy

TravelBuddy is Shreya and Suryansh's campus travel coordination project, initially for Chitkara University students. The planned app helps students find compatible trip plans and coordinate travelling together; it does not book transport.

## Current status

Implemented: a local Express API with JSON body parsing, a health endpoint, consistent JSON error responses, and startup/error logging. No database, authentication, OTP delivery, Socket.IO, deployment, or mobile application is implemented here.

Shreya owns this backend/docs stage. Suryansh will create `mobile/` after the agreed handoff; that directory is deliberately absent today. Repository: https://github.com/ShreyaGuleria/Travel-Buddy/.

## Prerequisites

- Node.js 24 LTS (use the latest available 24.x patch) and its bundled npm. This baseline was checked with Node v24.19.0 and npm 11.17.0.
- Git and a code editor such as VS Code.

Check your installation in a terminal:

```powershell
node --version
npm --version
git --version
```

## Installation

Open a terminal in the project root, then:

```powershell
cd server
npm ci
```

`npm ci` installs the versions recorded in `package-lock.json`. A dependency is a package our code uses; Express handles HTTP routing. The lockfile also records Express's own dependencies. Keep both package files when sharing the project. Run the following commands from `server/`.

## Configuration

No configuration file is required: the default port is `3000`.

To customize it, copy the safe example once (do not overwrite an existing `.env`):

```powershell
Copy-Item .env.example .env
```

Edit `PORT=3000` in `.env` to a free port such as `3001`. A port identifies the service to contact on your computer. Valid configured values are integers from 1 to 65535.

An environment variable is a setting passed to a running program. `npm start` uses Node's built-in `--env-file-if-exists=.env` option to load `server/.env`; a missing file is allowed. An existing terminal `PORT` variable takes precedence over the file. `.env.example` is documentation and is never loaded automatically. Real `.env` files stay out of Git.

## Startup

```powershell
npm start
```

Expect `TravelBuddy API listening on 0.0.0.0:3000` with the chosen port. Leave this terminal running. Stop the server with Ctrl+C. Use `http://127.0.0.1:3000` for local requests. The `0.0.0.0` binding accepts traffic on all IPv4 interfaces, as required by the host; it is not a public URL. On your laptop it can also permit network access if your firewall allows it.

If the port is already occupied (`EADDRINUSE`), stop the other service or choose a different `PORT`. Invalid configured ports stop startup with a clear error.

To restart, press Ctrl+C in the server terminal, wait for the prompt, then run `npm start` again. No watcher or background service is installed. The operating system releases the listening port when the process ends. Startup logs show only the local address; request-error logs show the status and a fixed error category, never request bodies, headers, or environment values. Unexpected request errors return generic JSON without an error stack.

## Verify in a second terminal

Use your configured port if it differs from 3000:

```powershell
curl.exe -i http://127.0.0.1:3000/health
curl.exe -i http://127.0.0.1:3000/does-not-exist
```

The first response must have HTTP status `200` and JSON:

```json
{"status":"ok","service":"travelbuddy-api"}
```

The second must have HTTP status `404` and JSON:

```json
{"error":"not_found"}
```

An endpoint is an HTTP method plus a path, such as `GET /health`. HTTP status codes describe the result: `200` means success; `404` means no matching endpoint. The health response proves the API process can answer requests, not that future databases or email providers work.

### JSON request bodies and errors

`app.use(express.json())` parses requests whose content type is `application/json`, making their data available as `req.body` before routes run. It uses Express's default 100 KB limit and accepts JSON objects/arrays. Parsing checks JSON syntax; it does **not** validate required fields, types, permissions, or business rules. Future routes must validate their own inputs. There is no permanent body-echo endpoint.

Send malformed JSON to see the parser's error response:

```powershell
curl.exe -i -X POST http://127.0.0.1:3000/health -H 'Content-Type: application/json' --data-raw '{'
```

Expect HTTP `400` and `{"error":"invalid_json"}`. Valid JSON sent to this same POST path still returns `404`, because only **GET** `/health` is a route. Bodies over the JSON limit return `413` with `{"error":"payload_too_large"}`. Other client request errors use their 4xx status with `{"error":"bad_request"}`. Unexpected request errors return `500` with `{"error":"internal_error"}`. A malformed or oversized JSON body is rejected before route lookup, including on otherwise unknown URLs.

For a repeatable response check, run this from `server/` while the server runs (adjust the URL if needed):

```powershell
node --input-type=module -e 'import assert from "node:assert/strict"; const base="http://127.0.0.1:3000"; for (const [path,status,body] of [["/health",200,{status:"ok",service:"travelbuddy-api"}],["/does-not-exist",404,{error:"not_found"}]]) { const r=await fetch(base+path); assert.equal(r.status,status); assert.match(r.headers.get("content-type"),/application\/json/); assert.deepEqual(await r.json(),body); } console.log("Health and 404 checks passed");'
```

## File guide and request flow

- `server/package.json`: npm commands, Node version requirement, module style, and direct dependency.
- `server/package-lock.json`: exact resolved dependencies, generated by npm.
- `server/.env.example`: safe configuration template.
- `server/src/index.js`: the complete Day 1 server.
- `docs/week-1-contract.md`: implemented API agreement and future scope.
- `docs/week-1-results.md`: actual verification evidence and limits.
- `docs/decisions.md`: reasons for the initial choices and open questions.
- `.gitignore`: excludes private configuration and generated files; allows examples and lockfiles.

The server uses ECMAScript modules (ESM): `"type": "module"` makes `.js` files use `import`, JavaScript's standard module syntax. No transpiler or compilation step is needed.

Node.js runs JavaScript and provides the networking runtime; Express is a dependency that adds request routing and middleware. An HTTP request carries a method, URL, headers, and sometimes a body. An HTTP response carries a status code, headers, and sometimes a body.

In `index.js`, `import express` loads the dependency and `express()` creates the application. `process.env.PORT ?? '3000'` reads configuration with a fallback. The next checks reject invalid port values before startup. `app.listen(...)` opens the local port so the application can receive requests.

For each request, middleware runs in registration order: JSON parser -> matching route -> 404 fallback. `app.get('/health', ...)` handles GET `/health` using `res.status(200).json(...)`. That sends the response, so it does not continue to the fallback. An unknown path has no matching route and reaches `res.status(404).json(...)`. The fallback must come after the routes or it would answer before they could run. Parsing/route errors skip normal middleware and reach the final four-argument `(err, req, res, next)` handler, which logs a safe category and sends a JSON error response.

Optional predictions: what happens if the 404 handler is registered first? Which port wins when `.env` and the terminal both define `PORT`? Hands-on exercise: start, request `/health` and `/healthz`, stop with Ctrl+C, start again, and confirm `/health` still responds. Then explain the two status codes in your own words.

Only the health route, unknown-route fallback, JSON parser, and error handling exist today. The university email domain `chitkara.edu.in` and a working university test inbox were confirmed by Shreya; no domain restriction or application email delivery has been implemented or tested.

## Day 2 deployment: Render Free

Status: local preparation verified; public deployment and mobile-data check pending. Public base URL, health URL, and deployed commit are not yet verified.

Local hosting ends when the program on your laptop stops. Cloud hosting runs a separate copy on Render. HTTPS encrypts traffic to Render using its managed certificate; Render forwards traffic to the Node HTTP server. WebSockets keep a connection open for two-way messages, making this service model suitable for later Socket.IO work. Socket.IO is not installed or tested.

| Service setting | Value |
| --- | --- |
| Repository / branch | `https://github.com/ShreyaGuleria/Travel-Buddy` / `main` |
| Type / runtime / plan | Web Service / Node / Free |
| Region | Singapore |
| Root directory | Repository root; commands target `server/` explicitly |
| Build command | `npm --prefix server ci` |
| Start command | `npm --prefix server start` |
| Node version | 24.x via package engines; deployed patch pending logs |
| Environment | `NODE_ENV=production`; `PORT` supplied by Render |
| Secrets / real `.env` | None required; never upload a real `.env` |

The integration does not expose a root-directory field. npm's `--prefix server` targets the backend package, and the startup script runs there, so `src/index.js` and optional `.env` resolve inside `server/`. Equivalent dashboard settings are Root Directory `server`, Build `npm ci`, Start `npm start`. Use one approach, not both. No Dockerfile or `render.yaml` is needed.

Build installs the locked dependencies; there is no compilation. Startup runs the persistent server on the host-assigned port. Environment settings belong in the provider's Environment page; secret values must never be shared in chat or committed.

### Logs and updates

In the [Render dashboard](https://dashboard.render.com/), open the service. Deploy details show build output and source commit; Logs shows runtime stdout/stderr. Provider readiness defaults to TCP unless an HTTP health-check path is set. `/health` is also tested separately; you can set it under Settings -> Health Checks.

Automatic deployment requires a connected GitHub provider and Auto-Deploy On Commit. Public-repository-URL services require manual deployment. Check the actual service settings rather than assuming a push redeploys it. To redeploy: Deploys -> Manual Deploy -> Deploy latest commit. Clear the build cache only when troubleshooting requires it.

After deployment, test the actual public HTTPS base URL plus `/health` (200 and exact health JSON) and `/does-not-exist` (404 and error JSON). Do not guess the public URL from the service name.

Hands-on phone check, pending user confirmation: stop any local server, disable phone Wi-Fi, enable mobile data, and open the public HTTPS `/health` URL. Confirm that the expected JSON appears. This demonstrates access independently of the laptop.

### Verified provider limits, checked 2026-11-06

Render's Hobby workspace and Free web instance cost $0. Free services sleep after 15 idle minutes; documented wake time is around one minute, not a performance guarantee. The workspace receives 750 running hours/month. Hobby pricing lists 5 GB outbound bandwidth; build-pipeline docs list 500 Starter minutes/month. Verify the account's Billing page because published allowance pages have varied. Exhausted hours suspend services until the next month. Without a payment method, bandwidth exhaustion suspends free services and build-minute exhaustion blocks builds; with billing enabled, overages can cost money. Do not add a payment method, accept a trial, or choose a paid plan without approval. Signup/card-verification requirements for this account remain unverified.

No fixed expiry is stated for Free web services; the separate 30-day Free Postgres expiry is irrelevant here. Free services can restart and lose local files. WebSocket connections must handle reconnects after sleep/redeploy; actual Socket.IO behavior is future work.

Official sources: [free limits](https://render.com/docs/free), [pricing](https://render.com/pricing), [pipeline minutes](https://render.com/docs/build-pipeline), [web services and HTTPS](https://render.com/docs/web-services), [WebSockets](https://render.com/docs/websocket), [Node versions](https://render.com/docs/node-version), [deploys](https://render.com/docs/deploys), [logs](https://render.com/docs/logging).

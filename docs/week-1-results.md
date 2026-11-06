# Week 1 results - local Day 1 only

Date: 2026-11-06. Scope: local Day 1 baseline only.

## Inspection completed

- Workspace initially contained only the two project PDFs. Both were read; their broader Week 1 plan is deferred where it exceeds today's request.
- No applicable `AGENTS.md` files were found in the workspace or checked parent directories.
- `git status --short --branch` reported that the folder was not a Git repository; no local history existed to preserve.
- GitHub returned no branches and explicitly reported `Git Repository is empty` for the commit listing on `ShreyaGuleria/Travel-Buddy`.
- Available tools: Node v24.19.0, npm 11.17.0, Git 2.52.0.windows.1. VS Code was found during the earlier setup check; GUI startup is not retested here.

## Original baseline checks actually performed

| Check | Observed result |
| --- | --- |
| `npm install express@5 --cache ./.npm-cache --fetch-retries=0 --fetch-timeout=20000` | Passed after retrying with network access. Installed Express 5.3.0 as the only direct dependency; generated `package-lock.json`. npm reported 65 installed packages, 66 audited, and zero known vulnerabilities at that time. This is not a guarantee about future advisories. |
| `npm ci --offline --cache ./.npm-cache --no-audit --no-fund` | Passed, exit 0; installed 65 packages from the generated lockfile and local cache. This checked lockfile installation without another registry download. Plain online `npm ci` was not separately run. |
| `node --check src/index.js` | Passed, exit 0; JavaScript syntax accepted by Node v24.19.0. |
| `npm start`, with no `.env` and no `PORT` override | Printed the expected startup command, optional-file notice, and `TravelBuddy API listening at http://127.0.0.1:3000`. |
| `GET /health` via Node fetch assertions and `curl.exe -i` | HTTP 200, JSON content type, and exact parsed body `{"status":"ok","service":"travelbuddy-api"}`. |
| `GET /does-not-exist` via Node fetch assertions and `curl.exe -i` | HTTP 404, JSON content type, and exact parsed body `{"error":"not_found"}`. |
| Repeatable assertion command in README | Executed successfully; printed `Health and 404 checks passed`. |
| Temporary `.env` containing a free `PORT` | Started the server with the same Node arguments as `npm start`; startup address and successful health request used the file's port. |
| Terminal `PORT` with a different `.env` port | Startup address and successful health request used the terminal's port, proving precedence. |
| Invalid `PORT` values: empty string, `abc`, `0`, `65536`, `1.5` | Each process exited nonzero with `PORT must be an integer from 1 to 65535.` |
| `GET /healthz` and `POST /health` | Both returned HTTP 404 and the exact fallback JSON. |
| `HEAD /health` | Returned HTTP 200 with an empty body, as Express normally provides for a GET route. |

The configuration checks used temporary local child processes and assertions. The temporary `.env` was removed and those child processes were stopped. No credentials or test mailbox address were written. The standard startup server was also stopped after verification.

## Follow-up completion checks actually performed

The existing baseline was reused. No additional dependencies were installed. Added the built-in JSON parser, safe request-error responses/logs, and an explicit listening-error log.

| Check | Observed result |
| --- | --- |
| Current workspace and instructions | Existing baseline and PDFs preserved; no local `.git` or applicable `AGENTS.md` found before setup. |
| Remote inspection | GitHub branch listing was empty; network-enabled `git ls-remote https://github.com/ShreyaGuleria/Travel-Buddy.git` exited 0 with no references. The restricted attempt failed on network resolution. |
| `node --check src/index.js` | Passed before actual startup. |
| Documented `npm start` | Started without `.env`, logged `http://127.0.0.1:3000`. |
| `GET /health` | Asserted HTTP 200, JSON content type, exact parsed body `{"status":"ok","service":"travelbuddy-api"}`. |
| `GET /does-not-exist` | Asserted HTTP 404, JSON content type, exact body `{"error":"not_found"}`. |
| `POST /health` with valid JSON | HTTP 404 with the documented fallback; no POST route exists. |
| Malformed JSON request | HTTP 400 with `{"error":"invalid_json"}`. A dummy marker in the supplied body was absent from captured server logs. |
| JSON payload larger than 100 KB | HTTP 413 with `{"error":"payload_too_large"}`. Logs showed only `Request failed (413, payload_too_large).` |
| Occupied port | A second child process on port 3000 exited 1 and logged `Server failed to listen on port 3000 (EADDRINUSE).` The first test server was preserved. |
| Stop and restart | Stopped the npm-started test session, asserted no response on port 3000, ran `npm start` again on the same port, and asserted HTTP 200 with exact health JSON. |
| Configured `.env` port | A temporary `.env` with an available port was loaded using the exact Node arguments in the start script; the startup log and health response used that port. |
| Terminal port precedence | A different terminal `PORT` overrode the temporary `.env`; exact health response passed on the terminal port. |
| Invalid ports | Empty, `abc`, `0`, `65536`, and `1.5` each exited unsuccessfully with the documented validation message. |
| JSON parsing proof | A temporary copy of the actual source inserted a test-only POST handler before the 404. Nested object/array JSON round-tripped exactly from `req.body`. The copy was deleted; production source was checked unchanged and has no test endpoint. |
| Unexpected error proof | A throwing route in that temporary copy produced HTTP 500 with `{"error":"internal_error"}`; logs contained the safe category and excluded the dummy exception detail. |

All test-created child processes and the npm-started test sessions were stopped. Temporary `.env` and instrumented source files were removed. No unrelated processes were stopped. The local stop/restart check covers this environment's test-session interruption; other operating systems and production shutdown/draining are not tested.

Git publication follows these local checks. The final commit hash and actual push outcome are reported in the completion message rather than embedding a self-referencing hash in this file.

Pre-commit review: initialized `main` only after confirming the empty remote, added the exact origin URL, and fetched successfully with no remote references. Staged exactly the nine baseline source/configuration/documentation files. `git diff --cached --check` passed. An exact staged-path allowlist and a basic credential-pattern scan passed. `git check-ignore` confirmed private `.env` paths, dependencies, cache, logs, and build output are ignored; `.env.example` and the npm lockfile were staged successfully. The two original PDFs remain untouched and untracked.

## Environment restrictions encountered

Initial package download attempts failed with DNS errors in the restricted execution environment. Downloads succeeded with permitted network access. Initial local HTTP checks failed with access/timeout errors across the environment boundary; rerunning both the server and requests in the permitted environment passed. These restrictions did not require application changes and leave no outstanding Day 1 blocker.

The PDF reader was installed temporarily outside the project to read the existing documents; it is not a backend dependency.

## Reproduce the core checks

From a terminal in the project root:

```powershell
cd server
npm ci
node --check src/index.js
npm start
```

In a second terminal:

```powershell
curl.exe -i http://127.0.0.1:3000/health
curl.exe -i http://127.0.0.1:3000/does-not-exist
```

Expect 200/health JSON and 404/error JSON respectively, as specified in the contract. README includes an assertion command to check both automatically. For a configuration exercise, stop the server, copy `.env.example` to `.env` only if `.env` does not already exist, set `PORT=3001`, restart, and request `http://127.0.0.1:3001/health`.

## Day 2 local preparation - 2026-11-06

- Starting commit: `24dd06068a5d82b92817147f7f748b83cc39137d` on `main`. No tracked changes before this work; two original PDFs remain untracked and untouched. No deployment configuration or applicable project instruction file found.
- Before editing, started with `npm start` and asserted exact 200 health JSON and 404 fallback JSON. Stopped only that test session.
- Changed only the listening interface in source from `127.0.0.1` to `0.0.0.0`, including the startup message. Existing port configuration and package scripts reused.
- Ran `node --check src/index.js`, then documented startup with `PORT=10000`. Observed `TravelBuddy API listening on 0.0.0.0:10000`.
- Verified port 10000 was bound on the wildcard interface (a competing wildcard bind failed with EADDRINUSE). Asserted HTTP status, JSON content type, and exact parsed bodies for `/health` and `/does-not-exist`.
- Observed local request times: health 43 ms; unknown endpoint 4 ms. These are single laptop measurements, not public cloud measurements or guarantees.
- Stopped the test session. No real `.env` created, dependencies added, or unrelated process stopped.
- Render connection verified by workspace listing; Shreya confirmed `My Workspace`. Service listing returned no existing services before creation.

## Day 2 public deployment evidence - 2026-11-06

- Committed and normally pushed task-only changes as `78499d04f0b8b05d564e9e2090c54e46107242fb`. Exact staged-file allowlist and basic credential-pattern review passed. Original PDFs were excluded; no real `.env`, dependency folders, or generated cache staged.
- Created service `srv-dbn0avjm8hqs73bji2bg`, `travelbuddy-api`, in confirmed workspace `My Workspace`. The response confirms Node runtime, Singapore, one Free instance, repository/branch `ShreyaGuleria/Travel-Buddy` / `main`, root `""` (repository), build `npm --prefix server ci`, start `npm --prefix server start`, and nonsecret `NODE_ENV=production`. Render supplies `PORT`; no secret environment variables are needed.
- Public base URL: https://travelbuddy-api-uvpg.onrender.com ; health URL: https://travelbuddy-api-uvpg.onrender.com/health . Dashboard: https://dashboard.render.com/web/srv-dbn0avjm8hqs73bji2bg .
- Deployment `dep-dbn0b0bm8hqs73bji3gg` progressed from `build_in_progress` to `live`. The deployment API confirms exact source commit `78499d04f0b8b05d564e9e2090c54e46107242fb`. Creation accepted only the Free plan; no paid plan/trial or payment information supplied. Existing account billing state was not inspected.
- Automated real HTTPS requests from this computer (local test servers stopped): health HTTP 200 with exact parsed `{"status":"ok","service":"travelbuddy-api"}` and JSON content type; observed 1,114 ms. Unknown path HTTP 404 with exact `{"error":"not_found"}` and JSON content type; 159 ms. Repeated health HTTP 200 with exact JSON; 155 ms. These observations are not promised performance, and an idle cold start was not measured.
- User-confirmed check: Shreya reported the public health link works on her phone over mobile data, following the Wi-Fi-off/local-server-stopped instructions. This is her confirmation, not an automated device test or evidence of a mobile app build.
- Log inspection attempted three times: initial unfiltered request, then separate build and application queries. Each failed with HTTP 503 `failed to query loki: log retrieval is currently unavailable`. Logs and actual deployed Node patch remain unverified. Configuration requests Node 24.x through package engines; do not claim a specific observed cloud patch. Use the service's Deploys/build details and Logs views to inspect once retrieval recovers.
- Service details confirm `autoDeploy=yes`, trigger `commit`, branch `main`; unskipped post-creation push behavior not exercised. Public-repository cloning alone does not prove a connected GitHub provider. Documentation-only publication uses `[skip render]` to preserve the live verified source; no duplicate deployment manually triggered.
- No HTTP provider health-check path is configured (empty field); default TCP readiness is in use. `/health` was checked directly over HTTPS. No local servers or temporary test files remain.

## Remaining scope and limitations

Database, authentication, OTP/application email delivery, Socket.IO, mobile builds, and two-device app tests are not implemented or tested. Free-tier sleep/reconnect behavior, exact account usage allowances/payment-method state, and actual cloud Node patch remain unverified. The working inbox/domain and collaborator agreement are Shreya's confirmations. No message or handoff has been sent to Suryansh. His work must wait for Shreya's explicit handoff.

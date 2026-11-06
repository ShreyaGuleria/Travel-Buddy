# Initial decisions

Date: 2026-11-06. Scope: local Day 1 baseline.

| Choice | Reason |
| --- | --- |
| Preserve both existing project PDFs | They contain the proposal and broader workplan. Today's narrower request takes priority over their commit/push/deploy steps. |
| Create the first baseline on `main` only after verification | The original local-only request left Git untouched. Shreya's follow-up explicitly authorizes commit and push. Both the connector and `git ls-remote` were rechecked and showed no remote branches/references before setup. Never overwrite later remote work. |
| Node.js 24 LTS, `engines: 24.x` | Supported release line already installed; keeps the documented built-in environment loader available. Prefer the latest 24.x patch for new installs. |
| ESM with `type: module` and `import` | Standard JavaScript module syntax without a build step. |
| Express as the only direct dependency | Sufficient for two response paths; no extra framework, environment loader, or development watcher needed. |
| npm-generated package lock | Records exact direct and indirect versions for repeatable `npm ci` installs. |
| Optional `.env` through Node's built-in loader | No `dotenv` dependency; default startup works without a private file. Terminal settings override file settings. |
| Default port 3000; validate overrides | Predictable local setup and clear feedback for mistakes. |
| Day 1 used 127.0.0.1; Day 2 uses 0.0.0.0 | Render must reach the service through its network. Keep the existing configured `PORT`; do not hard-code a cloud port. |
| Fixed JSON health and 404 shapes | Easy to verify and agree before mobile integration. |
| Built-in `express.json()` and a final JSON error handler | Accept JSON without adding dependencies; keep parser failures and unexpected errors predictable without logging supplied data. Parsing is not validation. |
| Default process stop behavior | No database or background work needs draining in this local stage. Stop/restart on the same port was checked. Revisit graceful draining when resources or in-flight work require it. |
| Leave `mobile/` absent | Suryansh owns the later mobile work after handoff. |

## Team-confirmed context

Shreya confirmed that both collaborators have repository access, Suryansh will wait for handoff, and the university test inbox works with domain `chitkara.edu.in`. These are user confirmations, not independently executed permission or email-delivery tests. No full mailbox address or credentials are stored here.

## Open questions and later work

- What API shapes should authentication and trips use? Agree them before parallel work.
- Does the student email policy need additional domains or enrollment checks? Mailbox access alone does not establish enrollment.
- Which email sender should be used? Render Free was selected for Day 2; application email delivery is not tested.
- What host/network configuration will allow Suryansh's physical phone to reach the API?
- What should the later Socket.IO test event and access rules be?
- Shreya must explicitly hand off after the baseline is available; a successful push alone does not authorize Suryansh to start.

## References

## Day 2 hosting decision - 2026-11-06

Shreya chose Render Free and confirmed the connected workspace `My Workspace`. No existing services were returned there. One web service in Singapore is intended; no database, paid compute, or trial is authorized.

| Option | Verified facts and tradeoff |
| --- | --- |
| Render Free, selected | Persistent Node service while awake; managed HTTPS and WebSockets; 750 running hours/workspace/month; sleeps after 15 idle minutes with roughly a minute to wake. Hobby pricing lists 5 GB bandwidth and pipeline docs list 500 Starter minutes; verify actual account allowances. Without a payment method, exhaustion suspends services/builds instead of allowing overages. No fixed web-service expiry stated. |
| Koyeb Free, not selected | One 512 MB/0.1 vCPU/2 GB instance per organization; sleeps after one idle hour; Frankfurt or Washington only. Supports GitHub builds, environment settings, logs, HTTPS and WebSockets (documented stream duration up to 12 hours). Billing FAQ requires a card, describes a $29 temporary hold and a prorated selected-plan charge at signup. This signup path is unsuitable for the no-charge constraint. No fixed free-instance expiry is stated. |

Both run Node services suitable for later Socket.IO; actual Socket.IO compatibility/reconnect behavior remains untested. Render is simpler here and its connection is available. Its account-specific payment-verification requirement and allowance display are still unverified; stop if payment is required.

Only necessary source change: wildcard binding. No dependency, Dockerfile, or Blueprint added. The integration lacks a root-directory field, so use repository root and `npm --prefix server ci` / `npm --prefix server start`. `NODE_ENV=production` is nonsecret; Render provides `PORT`; package engines choose Node 24.x. Actual version and deployment trigger will be checked from the created service/logs. Automatic deployment needs a connected GitHub provider; public-repository clones need manual deploys.

Official sources checked: [Render free](https://render.com/docs/free), [pricing](https://render.com/pricing), [build pipeline](https://render.com/docs/build-pipeline), [Node](https://render.com/docs/node-version), [WebSockets](https://render.com/docs/websocket), [deploys](https://render.com/docs/deploys), [Koyeb instances](https://www.koyeb.com/docs/reference/instances), [Koyeb billing](https://www.koyeb.com/docs/faqs/pricing), [Koyeb network](https://www.koyeb.com/docs/reference/edge-network), [Koyeb builds](https://www.koyeb.com/docs/build-and-deploy).

- Node.js release status: https://github.com/nodejs/Release#release-schedule
- Built-in environment file loading: https://nodejs.org/docs/latest-v24.x/api/cli.html#--env-file-if-existsfile

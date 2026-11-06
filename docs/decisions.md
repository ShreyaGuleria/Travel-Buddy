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
| Bind to 127.0.0.1 | Local computer testing only; device networking will be a separate decision. |
| Fixed JSON health and 404 shapes | Easy to verify and agree before mobile integration. |
| Built-in `express.json()` and a final JSON error handler | Accept JSON without adding dependencies; keep parser failures and unexpected errors predictable without logging supplied data. Parsing is not validation. |
| Default process stop behavior | No database or background work needs draining in this local stage. Stop/restart on the same port was checked. Revisit graceful draining when resources or in-flight work require it. |
| Leave `mobile/` absent | Suryansh owns the later mobile work after handoff. |

## Team-confirmed context

Shreya confirmed that both collaborators have repository access, Suryansh will wait for handoff, and the university test inbox works with domain `chitkara.edu.in`. These are user confirmations, not independently executed permission or email-delivery tests. No full mailbox address or credentials are stored here.

## Open questions and later work

- What API shapes should authentication and trips use? Agree them before parallel work.
- Does the student email policy need additional domains or enrollment checks? Mailbox access alone does not establish enrollment.
- Which email sender and deployment provider should be used? Delivery and provider limits have not been tested.
- What host/network configuration will allow Suryansh's physical phone to reach the API?
- What should the later Socket.IO test event and access rules be?
- Shreya must explicitly hand off after the baseline is available; a successful push alone does not authorize Suryansh to start.

## References

- Node.js release status: https://github.com/nodejs/Release#release-schedule
- Built-in environment file loading: https://nodejs.org/docs/latest-v24.x/api/cli.html#--env-file-if-existsfile

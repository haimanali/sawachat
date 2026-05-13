# SawaChat Automated Tests

Automated Vitest suite for the SawaChat GP2 project. These tests cover the unit, database integration, Socket.IO implementation, latency, and concurrency checks documented in `gp.tex`.

## Requirements

- Node.js 20+
- npm
- MySQL/WAMP running locally for database-backed tests
- SawaChat backend running at `http://localhost:3000` for Socket.IO, latency, and concurrency tests

The tests expect the local database configuration used by the project:

```text
host: localhost
user: root
password: SawaChat10@
database: sawachat
```

## Setup

```bash
npm install
```

## Test Files

| File | Purpose |
|---|---|
| `core.test.ts` | Unit tests for Bcrypt hashing, Zod schema validation, and UUID v4 generation. |
| `integration.test.ts` | MySQL connection, client registration persistence, and strike/ban database logic. |
| `socket.test.ts` | Authenticated Socket.IO handshake, realtime listeners, and unauthorized socket rejection. |
| `latency.test.ts` | Authenticated HTTP session latency and authenticated Socket.IO handshake latency. |
| `concurrency.test.ts` | 10,000 authenticated WebSocket connection scalability test. |

## Running Tests

```bash
npm test
```

Runs the main automated suite:

- `core.test.ts`
- `integration.test.ts`
- `socket.test.ts`
- `latency.test.ts`

The 10,000-connection concurrency test is intentionally separate because it is heavier.

## Individual Test Commands

```bash
npm run test:unit
npm run test:integration
npm run test:socket
npm run test:implementation
npm run test:latency
npm run test:concurrency:vitest
```

## Report Commands

```bash
npm run test:report
npm run test:unit:report
npm run test:integration:report
npm run test:implementation:report
npm run test:latency:report
npm run test:concurrency:report
```

Reports are generated under `reports/` and are intentionally ignored by Git.

## Preview Commands

```bash
npm run report:preview
npm run report:unit:preview
npm run report:integration:preview
npm run report:implementation:preview
npm run report:latency:preview
npm run report:concurrency:preview
```

These commands start a local Vite preview server. Open the displayed local URL in a browser, usually:

```text
http://localhost:4173/
```

## Environment Overrides

The concurrency and latency suites can be adjusted with environment variables.

PowerShell examples:

```powershell
$env:SAWACHAT_CONCURRENCY_TARGET=100
$env:SAWACHAT_CONCURRENCY_BATCH=20
$env:SAWACHAT_LATENCY_REQUESTS=20
$env:SAWACHAT_MAX_AVG_LATENCY_MS=2000
$env:SAWACHAT_MAX_P95_LATENCY_MS=2000
$env:SAWACHAT_MAX_HANDSHAKE_LATENCY_MS=2000
```

## Git Hygiene

Do not commit generated files:

- `node_modules/`
- `reports/`
- `*.html`
- environment files

Only source tests, `package.json`, `package-lock.json`, `vitest.config.ts`, `.gitignore`, and this README should be pushed.

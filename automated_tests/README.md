# SawaChat — Automated Test Suite

Vitest-based automated test suite for the SawaChat graduation project (GP2). Covers unit testing, database integration, Socket.IO implementation verification, HTTP/WebSocket latency benchmarking, and a 10,000-connection concurrency scalability test.

---

## Requirements

- **Node.js** v20+
- **npm**
- **MySQL** running locally with the project database loaded (for integration tests)
- **SawaChat backend** running at `http://localhost:3000` (for socket, latency, and concurrency tests)

The tests use the same database credentials as the backend:

```text
host:     localhost
user:     root
password: SawaChat10@
database: sawachat
```

---

## Setup

```bash
cd automated_tests
npm install
```

---

## Test Files

| File | Category | What it tests |
|---|---|---|
| `core.test.ts` | Unit | Bcrypt password hashing, Zod schema validation, UUID v4 generation |
| `integration.test.ts` | Integration | MySQL connection pool, client registration, strike/ban DB logic |
| `socket.test.ts` | Implementation | Authenticated Socket.IO handshake, real-time event listeners, unauthorized rejection |
| `latency.test.ts` | Performance | HTTP session-check latency (avg + p95), WebSocket handshake latency |
| `concurrency.test.ts` | Scalability | 10,000 simultaneous authenticated WebSocket connections (≥ 95% success threshold) |

---

## Running Tests

### Full suite (unit + integration + socket + latency)

```bash
npm test
```

### Individual tests

```bash
npm run test:unit           # core.test.ts
npm run test:integration    # integration.test.ts
npm run test:socket         # socket.test.ts  (also aliased as test:implementation)
npm run test:latency        # latency.test.ts
npm run test:concurrency:vitest  # concurrency.test.ts (heavy — run separately)
```

---

## Generating Reports

Each command produces HTML, JUnit XML, and JSON reports under `reports/`.

```bash
npm run test:report                  # full suite report
npm run test:unit:report             # unit only
npm run test:integration:report      # integration only
npm run test:implementation:report   # socket/implementation only
npm run test:latency:report          # latency only
npm run test:concurrency:report      # concurrency only
```

Reports are written to:

```
reports/
├── html/
│   ├── combined/index.html
│   ├── unit/index.html
│   ├── integration/index.html
│   ├── implementation/index.html
│   ├── latency/index.html
│   └── concurrency/index.html
├── combined-junit.xml
├── combined-results.json
└── coverage/
```

> [!NOTE]
> The `reports/` directory is excluded from Git. It is generated locally on each run.

---

## Previewing HTML Reports

Open a generated report in the browser using the Vite preview server:

```bash
npm run report:preview               # combined report → http://localhost:4173
npm run report:unit:preview
npm run report:integration:preview
npm run report:implementation:preview
npm run report:latency:preview
npm run report:concurrency:preview
```

---

## Vitest Configuration

`vitest.config.ts` key settings:

| Setting | Value | Reason |
|---|---|---|
| `testTimeout` | `10 000 ms` | Standard limit for all unit/integration/socket tests |
| `hookTimeout` | `10 000 ms` | DB connection setup/teardown |
| `slowTestThreshold` | `15 000 ms` | Prevents the concurrency load test from being flagged as slow |
| `coverage.provider` | `v8` | Built-in V8 coverage |

---

## Environment Overrides

The concurrency and latency suites can be tuned with environment variables (PowerShell syntax):

```powershell
# Concurrency
$env:SAWACHAT_CONCURRENCY_TARGET = 10000   # total connections to attempt (default: 10000)
$env:SAWACHAT_API_URL = "http://localhost:3000"

# Latency
$env:SAWACHAT_LATENCY_REQUESTS = 20
$env:SAWACHAT_MAX_AVG_LATENCY_MS = 2000
$env:SAWACHAT_MAX_P95_LATENCY_MS = 2000
$env:SAWACHAT_MAX_HANDSHAKE_LATENCY_MS = 2000
```

---

## Git Hygiene

The following are excluded from version control and must **not** be committed:

- `node_modules/`
- `reports/`
- `*.html` (generated)
- environment files (`.env`, `*.local`)

Only source files should be pushed:
`*.test.ts`, `vitest.config.ts`, `tsconfig.json`, `package.json`, `package-lock.json`, `.gitignore`, `README.md`

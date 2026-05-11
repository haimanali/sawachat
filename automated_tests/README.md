# SawaChat Automated Tests

Automated test suite for SawaChat GP2 — covering unit, integration, latency, and concurrency testing.

## Test Scripts

| Script | Command | Requires |
|---|---|---|
| **Unit Tests** (14 assertions) | `node unit_tests.js` | Nothing — runs in-process |
| **Integration Tests** (21 assertions) | `node integration_tests.js` | WAMP/MySQL running |
| **Latency Test** (20 pings) | `node latency_test.js` | WAMP/MySQL + Backend server |
| **Concurrency Test** (10K connections) | `node --max-old-space-size=8192 concurrency_test.js` | Backend server |

## Setup

```bash
cd automated_tests
npm install
```

## Running

```bash
# Unit tests — no dependencies needed
npm run test:unit

# Integration tests — requires WAMP/MySQL
npm run test:integration

# Latency test — requires WAMP/MySQL + backend server (npm run dev)
npm run test:latency

# Concurrency test — requires backend server
npm run test:concurrency
```

## File Overview

- `unit_tests.js` — Tests Bcrypt hashing, Zod schema validation, and UUID generation
- `integration_tests.js` — Tests MySQL connection, user registration flow, and strike/ban logic
- `latency_test.js` — Authenticates via REST API, connects WebSocket, measures round-trip latency
- `concurrency_test.js` — Stress test with 10,000 simultaneous WebSocket connections

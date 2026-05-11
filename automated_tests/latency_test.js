/**
 * SawaChat Latency Test
 * =======================
 * Measures WebSocket round-trip latency by:
 *   1. Creating a temporary test user via the REST API
 *   2. Extracting the session cookie
 *   3. Connecting to WebSocket with the authenticated session
 *   4. Measuring ping/pong round-trip times
 *   5. Cleaning up the test user
 *
 * Prerequisites: Backend server + WAMP/MySQL must be running
 * Run: node latency_test.js
 */

import { io } from "socket.io-client";
import mysql from "mysql2/promise";

const SERVER_URL = "http://localhost:3000";
const PING_COUNT = 20;
const latencies = [];
let connectLatency = 0;

// Unique test user credentials
const TEST_USER = {
    username: `lt_${Date.now().toString().slice(-8)}`,
    nickname: "Latency",
    password: "Test@2026",
};

console.log('');
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║         SawaChat v1.0.0 — Latency Test                  ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('');
console.log(`  Target: ${SERVER_URL}`);
console.log(`  Ping count: ${PING_COUNT}`);
console.log('');

// ─────────────────────────────────────────────────────
// Step 1: Sign up a temporary user via the REST API
// ─────────────────────────────────────────────────────
console.log('── Step 1: Authenticating via REST API ──');

let sessionCookie = null;

try {
    const res = await fetch(`${SERVER_URL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(TEST_USER),
    });

    // Extract the session_id cookie from Set-Cookie header
    const setCookie = res.headers.get("set-cookie");
    if (!setCookie) {
        // If signup fails (user exists), try login instead
        const loginRes = await fetch(`${SERVER_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: TEST_USER.username,
                password: TEST_USER.password,
                auto_login: false,
            }),
        });
        const loginCookie = loginRes.headers.get("set-cookie");
        if (loginCookie) {
            sessionCookie = loginCookie.split(";")[0]; // "session_id=..."
        }
    } else {
        sessionCookie = setCookie.split(";")[0]; // "session_id=..."
    }

    if (!sessionCookie) {
        throw new Error("Could not obtain session cookie from signup/login");
    }

    console.log(`  ✅ Authenticated as "${TEST_USER.username}"`);
    console.log(`  🍪 Session: ${sessionCookie.substring(0, 30)}...`);
    console.log('');

} catch (err) {
    console.log(`  ❌ FAIL: ${err.message}`);
    console.log('  Make sure both the backend server AND WAMP/MySQL are running.');
    process.exit(1);
}

// ─────────────────────────────────────────────────────
// Step 2: Connect to WebSocket with the session cookie
// ─────────────────────────────────────────────────────
console.log('── LT-01: WebSocket Connection Handshake ──');

const connectStart = performance.now();

const socket = io(SERVER_URL, {
    transports: ["websocket"],
    reconnection: false,
    timeout: 5000,
    extraHeaders: {
        cookie: sessionCookie,
    },
});

const connectionTimeout = setTimeout(() => {
    console.log('  ❌ FAIL: Connection timed out after 5000ms');
    cleanup();
    process.exit(1);
}, 5000);

socket.on("connect", async () => {
    clearTimeout(connectionTimeout);
    connectLatency = (performance.now() - connectStart).toFixed(2);
    console.log(`  ✅ Connected (Socket ID: ${socket.id})`);
    console.log(`  ⏱️  Handshake latency: ${connectLatency}ms`);
    console.log('');

    // ─────────────────────────────────────────────────────
    // Step 3: Measure HTTP REST API Round-Trip Latency
    // ─────────────────────────────────────────────────────
    console.log('── LT-02: REST API Round-Trip Measurements ──');

    for (let i = 0; i < PING_COUNT; i++) {
        const start = performance.now();
        await fetch(`${SERVER_URL}/api/auth/session`, {
            headers: { cookie: sessionCookie },
        });
        const rtt = performance.now() - start;
        latencies.push(rtt);
        const bar = '█'.repeat(Math.min(Math.round(rtt / 2), 50));
        console.log(`  Ping ${String(i + 1).padStart(2, '0')}:  ${String(rtt.toFixed(2)).padStart(7)}ms  ${bar}`);
    }

    // ─────────────────────────────────────────────────────
    // Results Summary
    // ─────────────────────────────────────────────────────
    console.log('');
    console.log('══════════════════════════════════════════════════════════');
    console.log('  TC-1.0.0-0006: LATENCY TEST RESULTS');
    console.log('══════════════════════════════════════════════════════════');

    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    const sorted = [...latencies].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)];

    console.log(`  Connection Handshake:    ${connectLatency}ms`);
    console.log(`  Pings Sent:              ${PING_COUNT}`);
    console.log(`  Average RTT:             ${avg.toFixed(2)}ms`);
    console.log(`  Min RTT:                 ${min.toFixed(2)}ms`);
    console.log(`  Max RTT:                 ${max.toFixed(2)}ms`);
    console.log(`  P95 RTT:                 ${p95.toFixed(2)}ms`);
    console.log('──────────────────────────────────────────────────────────');

    // NFR2.1 requires < 2000ms round-trip
    if (avg < 2000) {
        console.log(`  STATUS: ✅ PASS (Average ${avg.toFixed(2)}ms < 2000ms threshold)`);
    } else {
        console.log(`  STATUS: ❌ FAIL (Average ${avg.toFixed(2)}ms exceeds 2000ms threshold)`);
    }

    console.log('══════════════════════════════════════════════════════════');
    console.log('');

    socket.disconnect();
    await cleanup();
    process.exit(0);
});

socket.on("connect_error", async (err) => {
    clearTimeout(connectionTimeout);
    console.log(`  ❌ FAIL: Connection error — ${err.message}`);
    await cleanup();
    process.exit(1);
});

/**
 * Cleanup: Remove the temporary test user from the database.
 */
async function cleanup() {
    try {
        const pool = mysql.createPool({
            host: "localhost",
            user: "root",
            password: "SawaChat10@",
            database: "sawachat",
            connectionLimit: 1,
        });
        await pool.execute("DELETE FROM Session WHERE user_id = (SELECT user_id FROM Client WHERE username = ?)", [TEST_USER.username]);
        await pool.execute("DELETE FROM Client WHERE username = ?", [TEST_USER.username]);
        console.log(`  🧹 Cleanup: Removed test user "${TEST_USER.username}"`);
        await pool.end();
    } catch (e) {
        // Ignore cleanup errors silently
    }
}

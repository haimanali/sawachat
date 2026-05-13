import { afterAll, describe, expect, it } from 'vitest';
import axios from 'axios';
import mysql from 'mysql2/promise';
import { io } from 'socket.io-client';
import { performance } from 'node:perf_hooks';

const API_URL = process.env.SAWACHAT_API_URL ?? 'http://localhost:3000';
const SOCKET_URL = process.env.SAWACHAT_SOCKET_URL ?? API_URL;
const requestCount = Number(process.env.SAWACHAT_LATENCY_REQUESTS ?? 20);
const maxAverageLatencyMs = Number(process.env.SAWACHAT_MAX_AVG_LATENCY_MS ?? 2_000);
const maxP95LatencyMs = Number(process.env.SAWACHAT_MAX_P95_LATENCY_MS ?? 2_000);
const maxHandshakeLatencyMs = Number(process.env.SAWACHAT_MAX_HANDSHAKE_LATENCY_MS ?? 2_000);

const testUsernames: string[] = [];

function getCookie(response: { headers: Record<string, any> }) {
  const setCookie = response.headers['set-cookie'];
  return Array.isArray(setCookie) ? setCookie[0] : setCookie;
}

function percentile(values: number[], p: number) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

async function createTestSession() {
  const username = `lt${Date.now().toString(36).slice(-8)}${Math.random().toString(36).slice(2, 5)}`;
  testUsernames.push(username);

  const signupResponse = await axios.post(`${API_URL}/api/signup`, {
    username,
    nickname: 'LatBot',
    password: 'Password123!',
  });

  expect(signupResponse.data, signupResponse.data?.log_message).toMatchObject({ success: true });

  const cookie = getCookie(signupResponse);
  expect(cookie, 'Signup succeeded but no session cookie was returned').toContain('session_id=');

  return { username, cookie };
}

afterAll(async () => {
  if (testUsernames.length === 0) return;

  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'SawaChat10@',
    database: 'sawachat',
  });

  for (const username of testUsernames) {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>('SELECT user_id FROM Client WHERE username = ?', [username]).catch(() => [[]]);
    const userId = rows[0]?.user_id;
    if (userId) {
      await pool.execute('DELETE FROM Session WHERE user_id = ?', [userId]).catch(() => undefined);
      await pool.execute('DELETE FROM Client WHERE user_id = ?', [userId]).catch(() => undefined);
    }
  }

  await pool.end();
});

describe('TC-1.0.0-0006: Latency and Performance', () => {
  it(`keeps authenticated session requests below ${maxAverageLatencyMs}ms average and ${maxP95LatencyMs}ms p95`, async () => {
    const { cookie } = await createTestSession();
    const latencies: number[] = [];

    for (let i = 0; i < requestCount; i++) {
      const start = performance.now();
      const response = await axios.get(`${API_URL}/api/auth/session`, {
        headers: { cookie },
      });
      latencies.push(performance.now() - start);

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({ success: true });
    }

    const average = latencies.reduce((sum, value) => sum + value, 0) / latencies.length;
    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    const p95 = percentile(latencies, 95);

    console.table({
      requests: requestCount,
      average_ms: Number(average.toFixed(2)),
      min_ms: Number(min.toFixed(2)),
      max_ms: Number(max.toFixed(2)),
      p95_ms: Number(p95.toFixed(2)),
    });

    expect(average).toBeLessThan(maxAverageLatencyMs);
    expect(p95).toBeLessThan(maxP95LatencyMs);
  });

  it(`establishes an authenticated Socket.IO handshake below ${maxHandshakeLatencyMs}ms`, async () => {
    const { cookie } = await createTestSession();
    const start = performance.now();

    await new Promise<void>((resolve, reject) => {
      const socket = io(SOCKET_URL, {
        extraHeaders: { cookie },
        reconnection: false,
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('Socket.IO handshake timed out'));
      }, maxHandshakeLatencyMs);

      socket.once('connect', () => {
        clearTimeout(timeout);
        const handshakeLatency = performance.now() - start;
        console.table({ handshake_ms: Number(handshakeLatency.toFixed(2)) });
        expect(handshakeLatency).toBeLessThan(maxHandshakeLatencyMs);
        socket.disconnect();
        resolve();
      });

      socket.once('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        reject(error);
      });
    });
  });
});

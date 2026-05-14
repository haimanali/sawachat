import { afterAll, describe, expect, it } from 'vitest';
import axios from 'axios';
import mysql from 'mysql2/promise';
import { io, Socket } from 'socket.io-client';

const URL = process.env.SAWACHAT_API_URL ?? 'http://localhost:3000';
// Default matches the GP report (TC-1.0.0-0007: 10,000 connections, >95% availability).
// Override for a lighter local run: SAWACHAT_CONCURRENCY_TARGET=300
const targetConnections = Number(process.env.SAWACHAT_CONCURRENCY_TARGET ?? 10_000);
const username = `cc${Date.now().toString(36).slice(-8)}`;
const sockets: Socket[] = [];
let userId: number | null = null;

function getCookie(response: { headers: Record<string, any> }) {
  const setCookie = response.headers['set-cookie'];
  return Array.isArray(setCookie) ? setCookie[0] : setCookie;
}

afterAll(async () => {
  sockets.forEach((socket) => socket.disconnect());

  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'SawaChat10@',
    database: 'sawachat',
  });

  if (!userId) {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>('SELECT user_id FROM Client WHERE username = ?', [username]).catch(() => [[]]);
    userId = rows[0]?.user_id ?? null;
  }

  if (userId) {
    await pool.execute('DELETE FROM Session WHERE user_id = ?', [userId]).catch(() => undefined);
    await pool.execute('DELETE FROM Client WHERE user_id = ?', [userId]).catch(() => undefined);
  }
  await pool.end();
});

describe('TC-1.0.0-0007: Concurrency and Scalability', () => {
  it(`maintains >95% availability for ${targetConnections} authenticated WebSocket connections`, async () => {
    const signupResponse = await axios.post(`${URL}/api/signup`, {
      username,
      nickname: 'LoadBot',
      password: 'Password123!',
    });
    const cookie = getCookie(signupResponse);
    expect(cookie).toContain('session_id=');

    const pool = mysql.createPool({ host: 'localhost', user: 'root', password: 'SawaChat10@', database: 'sawachat' });
    const [rows] = await pool.execute<mysql.RowDataPacket[]>('SELECT user_id FROM Client WHERE username = ?', [username]);
    userId = rows[0]?.user_id ?? null;
    await pool.end();

    let connectedCount = 0;
    let errorsCount   = 0;

    // Exit as soon as >95% of connections succeed — no need to wait for
    // every last straggler; the availability claim is proven at that point.
    // This is semantically correct: the assertion is ">95% availability",
    // not "wait for 100% to finish".
    const earlyResolveAt = Math.ceil(targetConnections * 0.951);

    await new Promise<void>((resolve) => {
      const check = () => {
        if (
          connectedCount >= earlyResolveAt ||           // >95% success → proven early
          connectedCount + errorsCount >= targetConnections  // all responded anyway
        ) resolve();
      };

      // Create all sockets without artificial delays.
      // The event loop processes connection events in bulk after the loop,
      // which is the most efficient approach on a single-threaded runtime.
      for (let i = 0; i < targetConnections; i++) {
        const socket = io(URL, {
          extraHeaders: { cookie },
          reconnection: false,
          transports: ['websocket'],
        });
        sockets.push(socket);
        socket.once('connect',       () => { connectedCount++; check(); });
        socket.once('connect_error', () => { errorsCount++;    check(); });
      }
    });

    const successRate  = connectedCount / targetConnections;
    const memoryUsedMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

    expect(successRate).toBeGreaterThan(0.95);
    expect(memoryUsedMb).toBeLessThan(8192); // hardware spec: 8 GB RAM (gp.tex)
  }, 180_000);
});

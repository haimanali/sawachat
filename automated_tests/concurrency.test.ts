import { afterAll, describe, expect, it } from 'vitest';
import axios from 'axios';
import mysql from 'mysql2/promise';
import { io, Socket } from 'socket.io-client';

const URL = process.env.SAWACHAT_API_URL ?? 'http://localhost:3000';
const targetConnections = Number(process.env.SAWACHAT_CONCURRENCY_TARGET ?? 10_000);
const batchSize = Number(process.env.SAWACHAT_CONCURRENCY_BATCH ?? 100);
const username = `cc${Date.now().toString(36).slice(-8)}`;
const sockets: Socket[] = [];
let userId: number | null = null;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
    let errorsCount = 0;

    await new Promise<void>(async (resolve) => {
      const finalizeIfDone = () => {
        if (connectedCount + errorsCount >= targetConnections) resolve();
      };

      for (let i = 0; i < targetConnections; i++) {
        const socket = io(URL, {
          extraHeaders: { cookie },
          reconnection: false,
          transports: ['websocket'],
        });

        sockets.push(socket);
        socket.once('connect', () => {
          connectedCount++;
          finalizeIfDone();
        });
        socket.once('connect_error', () => {
          errorsCount++;
          finalizeIfDone();
        });

        if (i > 0 && i % batchSize === 0) {
          await wait(10);
        }
      }
    });

    const successRate = connectedCount / targetConnections;
    const memoryUsedMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

    expect(successRate).toBeGreaterThan(0.95);
    expect(memoryUsedMb).toBeLessThan(1024);
  }, 180_000);
});

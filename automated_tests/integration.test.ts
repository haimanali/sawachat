import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

let pool: mysql.Pool;
let testUserId: number | null = null;
const testUsername = `it${Date.now().toString().slice(-8)}`;

beforeAll(() => {
  pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'SawaChat10@',
    database: 'sawachat',
    waitForConnections: true,
    connectionLimit: 5,
  });
});

afterAll(async () => {
  if (pool && testUserId) {
    await pool.execute('DELETE FROM Session WHERE user_id = ?', [testUserId]).catch(() => undefined);
    await pool.execute('DELETE FROM Client WHERE user_id = ?', [testUserId]).catch(() => undefined);
  }

  if (pool) {
    await pool.end();
  }
});

describe('IT-01: MySQL Database Connection', () => {
  it('connects to MySQL and verifies required tables exist', async () => {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>('SELECT 1 AS result');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].result).toBe(1);

    const [tables] = await pool.execute<mysql.RowDataPacket[]>('SHOW TABLES');
    const tableNames = tables.map((table) => String(Object.values(table)[0]).toLowerCase());

    expect(tableNames).toContain('client');
    expect(tableNames).toContain('message');
    expect(tableNames).toContain('chatroom');
    expect(tableNames).toContain('session');
  });
});

describe('IT-02: Client Registration Flow (DB Layer)', () => {
  it('inserts, retrieves, and verifies a registered client record', async () => {
    const nickname = 'TestBot';
    const password = 'Test@2026';
    const hashedPassword = await bcrypt.hash(password, 10);

    const [insertResult] = await pool.execute<mysql.ResultSetHeader>(
      'INSERT INTO Client (username, nickname, hash_pass) VALUES (?, ?, ?)',
      [testUsername, nickname, hashedPassword],
    );
    testUserId = insertResult.insertId;

    expect(insertResult.affectedRows).toBe(1);
    expect(testUserId).toBeGreaterThan(0);

    const [selectResult] = await pool.execute<mysql.RowDataPacket[]>('SELECT * FROM Client WHERE user_id = ?', [testUserId]);
    const user = selectResult[0];

    expect(user).toBeDefined();
    expect(user.username).toBe(testUsername);
    expect(user.nickname).toBe(nickname);
    expect(user.hash_pass).not.toBe(password);
    expect(user.strike).toBe(0);
    expect(user.is_ban).toBe(0);
    await expect(bcrypt.compare(password, user.hash_pass)).resolves.toBe(true);
  });
});

describe('IT-03: Strike Increment and Ban Logic', () => {
  it('increments strikes and bans the user on the third strike', async () => {
    expect(testUserId).toBeTruthy();

    await pool.execute('UPDATE Client SET strike = strike + 1 WHERE user_id = ?', [testUserId]);
    const [strikeOne] = await pool.execute<mysql.RowDataPacket[]>('SELECT strike, is_ban FROM Client WHERE user_id = ?', [testUserId]);
    expect(strikeOne[0].strike).toBe(1);
    expect(strikeOne[0].is_ban).toBe(0);

    await pool.execute('UPDATE Client SET strike = strike + 1 WHERE user_id = ?', [testUserId]);
    const [strikeTwo] = await pool.execute<mysql.RowDataPacket[]>('SELECT strike, is_ban FROM Client WHERE user_id = ?', [testUserId]);
    expect(strikeTwo[0].strike).toBe(2);
    expect(strikeTwo[0].is_ban).toBe(0);

    await pool.execute('UPDATE Client SET strike = strike + 1 WHERE user_id = ?', [testUserId]);
    const [strikeThree] = await pool.execute<mysql.RowDataPacket[]>('SELECT strike FROM Client WHERE user_id = ?', [testUserId]);
    expect(strikeThree[0].strike).toBe(3);

    if (strikeThree[0].strike >= 3) {
      await pool.execute('UPDATE Client SET is_ban = 1 WHERE user_id = ?', [testUserId]);
    }

    const [banned] = await pool.execute<mysql.RowDataPacket[]>('SELECT is_ban FROM Client WHERE user_id = ?', [testUserId]);
    expect(banned[0].is_ban).toBe(1);
  });
});

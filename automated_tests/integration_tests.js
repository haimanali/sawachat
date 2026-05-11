/**
 * SawaChat Integration Tests
 * ============================
 * Tests communication between modules (DB + API).
 * Prerequisites: WAMP must be running with the sawachat database.
 *                The backend server does NOT need to be running for DB tests.
 * 
 * Run: node integration_tests.js
 * 
 * Tests:
 *   IT-01: MySQL database connection and query execution
 *   IT-02: Client table insert and retrieval (Signup flow)
 *   IT-03: Strike increment and ban logic (AI moderation DB path)
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

let passed = 0;
let failed = 0;
let pool;

// unique test username so we don't collide with real data
const TEST_USERNAME = `t_${Date.now().toString().slice(-8)}`;
let testUserId = null;

function assert(testName, condition, detail) {
    if (condition) {
        console.log(`  ✅ PASS: ${testName}`);
        passed++;
    } else {
        console.log(`  ❌ FAIL: ${testName} — ${detail}`);
        failed++;
    }
}

console.log('');
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║         SawaChat v1.0.0 — Integration Tests             ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('');

try {
    // ─────────────────────────────────────────────────────
    // IT-01: MySQL Database Connection
    // ─────────────────────────────────────────────────────
    console.log('── IT-01: MySQL Database Connection ──');

    pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: 'SawaChat10@',
        database: 'sawachat',
        waitForConnections: true,
        connectionLimit: 5,
    });

    const [rows] = await pool.execute('SELECT 1 AS result');
    assert('Pool connection established', rows.length > 0, 'No rows returned');
    assert('Query returns expected value', rows[0].result === 1, `Got: ${rows[0].result}`);

    const [tables] = await pool.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0].toLowerCase());
    assert('Client table exists', tableNames.includes('client'), `Tables: ${tableNames.join(', ')}`);
    assert('Message table exists', tableNames.includes('message'), `Tables: ${tableNames.join(', ')}`);
    assert('ChatRoom table exists', tableNames.includes('chatroom'), `Tables: ${tableNames.join(', ')}`);
    assert('Session table exists', tableNames.includes('session'), `Tables: ${tableNames.join(', ')}`);

    console.log('');

    // ─────────────────────────────────────────────────────
    // IT-02: Client Registration (Insert + Retrieve)
    // ─────────────────────────────────────────────────────
    console.log('── IT-02: Client Registration Flow (DB Layer) ──');

    const testNickname = 'TestBot';
    const testPassword = 'Test@2026';
    const hashedPassword = await bcrypt.hash(testPassword, 12);

    // Insert
    const [insertResult] = await pool.execute(
        'INSERT INTO Client (username, nickname, hash_pass) VALUES (?, ?, ?)',
        [TEST_USERNAME, testNickname, hashedPassword]
    );
    testUserId = insertResult.insertId;
    assert('User inserted successfully', insertResult.affectedRows === 1, `Affected: ${insertResult.affectedRows}`);
    assert('Insert returned a valid user_id', testUserId > 0, `ID: ${testUserId}`);

    // Retrieve
    const [selectResult] = await pool.execute(
        'SELECT * FROM Client WHERE user_id = ?',
        [testUserId]
    );
    const user = selectResult[0];
    assert('User retrieved from database', user !== undefined, 'No user found');
    assert('Username matches', user.username === TEST_USERNAME, `Got: ${user.username}`);
    assert('Nickname matches', user.nickname === testNickname, `Got: ${user.nickname}`);
    assert('Password is stored as hash (not plain text)', user.hash_pass !== testPassword, 'Stored plain text!');
    assert('Strike count initialized to 0', user.strike === 0, `Got: ${user.strike}`);
    assert('Ban flag initialized to 0', user.is_ban === 0, `Got: ${user.is_ban}`);

    // Verify password hash works
    const passwordMatch = await bcrypt.compare(testPassword, user.hash_pass);
    assert('Bcrypt verify works on stored hash', passwordMatch === true, 'Hash verification failed');

    console.log('');

    // ─────────────────────────────────────────────────────
    // IT-03: Strike + Ban Logic (AI Moderation DB Path)
    // ─────────────────────────────────────────────────────
    console.log('── IT-03: Strike Increment and Ban Logic ──');

    // Strike 1
    await pool.execute('UPDATE Client SET strike = strike + 1 WHERE user_id = ?', [testUserId]);
    let [s1] = await pool.execute('SELECT strike, is_ban FROM Client WHERE user_id = ?', [testUserId]);
    assert('Strike 1: count is 1', s1[0].strike === 1, `Got: ${s1[0].strike}`);
    assert('Strike 1: user is NOT banned', s1[0].is_ban === 0, `Got: ${s1[0].is_ban}`);

    // Strike 2
    await pool.execute('UPDATE Client SET strike = strike + 1 WHERE user_id = ?', [testUserId]);
    let [s2] = await pool.execute('SELECT strike, is_ban FROM Client WHERE user_id = ?', [testUserId]);
    assert('Strike 2: count is 2', s2[0].strike === 2, `Got: ${s2[0].strike}`);
    assert('Strike 2: user is NOT banned', s2[0].is_ban === 0, `Got: ${s2[0].is_ban}`);

    // Strike 3 — should trigger ban
    await pool.execute('UPDATE Client SET strike = strike + 1 WHERE user_id = ?', [testUserId]);
    let [s3] = await pool.execute('SELECT strike FROM Client WHERE user_id = ?', [testUserId]);
    assert('Strike 3: count is 3', s3[0].strike === 3, `Got: ${s3[0].strike}`);

    // Simulate ban logic (same as AiService.ts: if total >= MAX_STRIKE, ban)
    const MAX_STRIKE = 3;
    if (s3[0].strike >= MAX_STRIKE) {
        await pool.execute('UPDATE Client SET is_ban = 1 WHERE user_id = ?', [testUserId]);
    }
    let [banned] = await pool.execute('SELECT is_ban FROM Client WHERE user_id = ?', [testUserId]);
    assert('Strike 3: user IS banned (is_ban = 1)', banned[0].is_ban === 1, `Got: ${banned[0].is_ban}`);

    console.log('');

} catch (err) {
    console.log(`\n  ❌ FATAL ERROR: ${err.message}`);
    console.log('  Make sure WAMP/MySQL is running with the sawachat database.\n');
    failed++;
} finally {
    // ─────────────────────────────────────────────────────
    // Cleanup: Remove test data
    // ─────────────────────────────────────────────────────
    if (pool && testUserId) {
        try {
            await pool.execute('DELETE FROM Client WHERE user_id = ?', [testUserId]);
            console.log(`  🧹 Cleanup: Removed test user (ID: ${testUserId})`);
        } catch (e) { /* ignore cleanup errors */ }
    }
    if (pool) await pool.end();

    // Summary
    console.log('');
    console.log('══════════════════════════════════════════════════════════');
    console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
    console.log('══════════════════════════════════════════════════════════');

    if (failed > 0) {
        console.log('  ⚠️  Some tests FAILED.');
        process.exit(1);
    } else {
        console.log('  🎉 All integration tests PASSED.');
        process.exit(0);
    }
}

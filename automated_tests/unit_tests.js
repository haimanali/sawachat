/**
 * SawaChat Unit Tests
 * ====================
 * Tests isolated functions WITHOUT needing a running server.
 * Run: node unit_tests.js
 * 
 * Tests:
 *   UT-01: Bcrypt password hashing and verification
 *   UT-02: Zod schema validation (valid + invalid payloads)
 *   UT-03: UUID v4 format generation
 */

import bcrypt from 'bcrypt';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

let passed = 0;
let failed = 0;

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
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║           SawaChat v1.0.0 — Unit Tests              ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log('');

// ─────────────────────────────────────────────────────
// UT-01: Bcrypt Password Hashing
// ─────────────────────────────────────────────────────
console.log('── UT-01: Bcrypt Password Hashing ──');

const testPassword = 'Sawa@2026';
const saltRounds = 12;

const hash = await bcrypt.hash(testPassword, saltRounds);
assert('Hash is generated (not empty)', hash && hash.length > 0, 'Hash was empty');
assert('Hash is not equal to plain text', hash !== testPassword, 'Hash matched plain text');
assert('Hash starts with $2b$ (bcrypt prefix)', hash.startsWith('$2b$'), `Got: ${hash.substring(0, 4)}`);

const matchCorrect = await bcrypt.compare(testPassword, hash);
assert('Correct password matches hash', matchCorrect === true, 'compare() returned false');

const matchWrong = await bcrypt.compare('WrongPassword!', hash);
assert('Wrong password does NOT match hash', matchWrong === false, 'compare() returned true for wrong password');

console.log('');

// ─────────────────────────────────────────────────────
// UT-02: Zod Schema Validation
// ─────────────────────────────────────────────────────
console.log('── UT-02: Zod Schema Validation ──');

// Replicate the actual signup_schema from requestFormat.ts
const signup_schema = z.object({
    username: z.string(),
    nickname: z.string(),
    password: z.string(),
});

// Valid payload
const validPayload = { username: 'petro123', nickname: 'Petro', password: 'Sawa@2026' };
const validResult = signup_schema.safeParse(validPayload);
assert('Valid payload is accepted', validResult.success === true, 'Schema rejected valid payload');

// Missing field
const missingField = { username: 'petro123', password: 'Sawa@2026' }; // no nickname
const missingResult = signup_schema.safeParse(missingField);
assert('Missing "nickname" field is rejected', missingResult.success === false, 'Schema accepted incomplete payload');

// Wrong type
const wrongType = { username: 123, nickname: 'Petro', password: 'Sawa@2026' };
const wrongResult = signup_schema.safeParse(wrongType);
assert('Non-string username is rejected', wrongResult.success === false, 'Schema accepted numeric username');

// Empty object
const emptyResult = signup_schema.safeParse({});
assert('Empty object is rejected', emptyResult.success === false, 'Schema accepted empty object');

// Extra fields (should pass — Zod strips extras by default)
const extraFields = { username: 'test', nickname: 'Test', password: 'pass', evil: 'injection' };
const extraResult = signup_schema.safeParse(extraFields);
assert('Extra fields do not cause rejection', extraResult.success === true, 'Schema rejected extra fields');

console.log('');

// ─────────────────────────────────────────────────────
// UT-03: UUID v4 Generation
// ─────────────────────────────────────────────────────
console.log('── UT-03: UUID v4 Generation ──');

const uuid1 = uuidv4();
const uuid2 = uuidv4();
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

assert('UUID is generated (not empty)', uuid1 && uuid1.length > 0, 'UUID was empty');
assert('UUID matches v4 format', uuidRegex.test(uuid1), `Got: ${uuid1}`);
assert('Two UUIDs are unique', uuid1 !== uuid2, `Both were: ${uuid1}`);
assert('UUID length is exactly 36 characters', uuid1.length === 36, `Length was: ${uuid1.length}`);

console.log('');

// ─────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────
console.log('══════════════════════════════════════════════════════');
console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log('══════════════════════════════════════════════════════');

if (failed > 0) {
    console.log('  ⚠️  Some tests FAILED.');
    process.exit(1);
} else {
    console.log('  🎉 All unit tests PASSED.');
    process.exit(0);
}

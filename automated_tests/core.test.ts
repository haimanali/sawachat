import { describe, expect, it } from 'vitest';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const signupSchema = z.object({
  username: z.string(),
  nickname: z.string(),
  password: z.string(),
});

describe('UT-01: Bcrypt Password Hashing', () => {
  it('produces a salted hash and verifies correct/incorrect passwords', async () => {
    const password = 'Sawa@2026';
    const hash = await bcrypt.hash(password, 10);

    expect(hash).toBeTruthy();
    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2b$')).toBe(true);
    await expect(bcrypt.compare(password, hash)).resolves.toBe(true);
    await expect(bcrypt.compare('WrongPassword!', hash)).resolves.toBe(false);
  });
});

describe('UT-02: Zod Schema Validation', () => {
  it('accepts valid signup payloads and rejects malformed payloads', () => {
    expect(signupSchema.safeParse({ username: 'petro123', nickname: 'Petro', password: 'Sawa@2026' }).success).toBe(true);
    expect(signupSchema.safeParse({ username: 'petro123', password: 'Sawa@2026' }).success).toBe(false);
    expect(signupSchema.safeParse({ username: 123, nickname: 'Petro', password: 'Sawa@2026' }).success).toBe(false);
    expect(signupSchema.safeParse({}).success).toBe(false);
    expect(signupSchema.safeParse({ username: 'test', nickname: 'Test', password: 'pass', evil: 'injection' }).success).toBe(true);
  });
});

describe('UT-03: UUID v4 Generation', () => {
  it('generates non-empty, unique, correctly formatted UUID v4 identifiers', () => {
    const uuid1 = uuidv4();
    const uuid2 = uuidv4();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(uuid1).toBeTruthy();
    expect(uuid1).toMatch(uuidRegex);
    expect(uuid1).not.toBe(uuid2);
    expect(uuid1).toHaveLength(36);
  });
});

import crypto from 'crypto';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const keyPath = path.join(app.getPath('userData'), '.jarvis-key');
  if (fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath);
  }
  const key = scryptSync(randomBytes(32).toString('hex'), 'jarvis-salt', KEY_LENGTH);
  fs.writeFileSync(keyPath, key, { mode: 0o600 });
  return key;
}

export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  try {
    const key = getEncryptionKey();
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return '';
  }
}

export function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function generateId(): string {
  return crypto.randomUUID();
}

const DESTRUCTIVE_PATTERNS = [
  /delete\s+(all|everything)/i,
  /format\s+(drive|disk|c:)/i,
  /rm\s+-rf/i,
  /remove\s+system/i,
];

export function isDestructiveCommand(command: string): boolean {
  return DESTRUCTIVE_PATTERNS.some((p) => p.test(command));
}

export function sanitizePath(userPath: string, allowedRoots?: string[]): string | null {
  const normalized = path.normalize(userPath);
  if (normalized.includes('..')) return null;

  if (allowedRoots) {
    const isAllowed = allowedRoots.some((root) => normalized.startsWith(path.normalize(root)));
    if (!isAllowed) return null;
  }
  return normalized;
}

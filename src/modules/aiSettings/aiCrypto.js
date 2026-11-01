/**
 * AES-256-GCM Authenticated Encryption for AI Provider API Keys
 * Enforces strict environment secret isolation via AI_SETTINGS_ENCRYPTION_KEY.
 */

import crypto from 'crypto';
import { env } from '../../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16; // Standard 128-bit tag for GCM

/**
 * Validates and derives the 256-bit encryption key from AI_SETTINGS_ENCRYPTION_KEY
 * FAILS SAFELY if the key is missing or invalid. Never silently falls back to another secret!
 */
export function getEncryptionKey() {
  const rawKey = (env.AI_SETTINGS_ENCRYPTION_KEY || process.env.AI_SETTINGS_ENCRYPTION_KEY || '').trim();

  if (!rawKey) {
    throw new Error(
      'CRITICAL SECURITY ERROR: AI_SETTINGS_ENCRYPTION_KEY is missing from environment. ' +
      'Cannot perform encryption/decryption operations.'
    );
  }

  // If provided as a 64-character hex string (32 bytes), parse directly
  if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    return Buffer.from(rawKey, 'hex');
  }

  // If provided as arbitrary string with at least 16 characters, derive 32-byte key deterministically
  if (rawKey.length >= 16) {
    return crypto.scryptSync(rawKey, 'vartiq-ai-crypto-salt-2026', 32);
  }

  throw new Error(
    'CRITICAL SECURITY ERROR: AI_SETTINGS_ENCRYPTION_KEY must be at least 16 characters (or 64 hex characters).'
  );
}

/**
 * Encrypts an API key using AES-256-GCM
 * @param {string} plainText
 * @returns {string} Format: "iv_hex:tag_hex:cipher_hex"
 */
export function encryptApiKey(plainText) {
  if (!plainText || typeof plainText !== 'string') return '';
  const clean = plainText.trim();
  if (!clean || clean.includes('••••')) return '';

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(clean, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts an AES-256-GCM encrypted API key string
 * @param {string} encryptedStr Format: "iv_hex:tag_hex:cipher_hex"
 * @returns {string} Plaintext API key
 */
export function decryptApiKey(encryptedStr) {
  if (!encryptedStr || typeof encryptedStr !== 'string') return '';
  const parts = encryptedStr.trim().split(':');
  if (parts.length !== 3) {
    // String is not in encrypted format (or already unencrypted/empty)
    return '';
  }

  const [ivHex, tagHex, cipherHex] = parts;
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const ciphertext = Buffer.from(cipherHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('[aiCrypto] Failed to decrypt API key (tampered or wrong key):', err.message);
    return '';
  }
}

/**
 * Produces a safe masked representation of an API key for Admin UI
 * @param {string} plainText
 * @returns {string} e.g. "AIza••••••••ABCD"
 */
export function maskApiKey(plainText) {
  if (!plainText || typeof plainText !== 'string') return '';
  const clean = plainText.trim();
  if (clean.length <= 8) return '••••••••';
  const prefix = clean.substring(0, 4);
  const suffix = clean.substring(clean.length - 4);
  return `${prefix}••••••••${suffix}`;
}

/**
 * Verifies encryption and decryption round-trip on a given plaintext string
 */
export function verifyCryptoRoundTrip(plainText) {
  const enc = encryptApiKey(plainText);
  if (!enc) return false;
  const dec = decryptApiKey(enc);
  return dec === plainText;
}


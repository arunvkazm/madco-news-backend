// src/utils/tokens.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

export function generateAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

export function generateRefreshToken(payload) {
  // create refresh as JWT - can also use opaque random token if you prefer
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

// helper to generate random token id (not required but useful)
export function randomTokenId() {
  return crypto.randomBytes(16).toString('hex');
}

import jwt from 'jsonwebtoken';

const JWT_ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
const JWT_REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;
const JWT_EMAIL_SECRET = process.env.EMAIL_TOKEN_SECRET;
const JWT_RESET_SECRET = process.env.RESET_TOKEN_SECRET;

export function signAccessToken(payload) {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '30d' });
}

export function signEmailToken(payload) {
  return jwt.sign(payload, JWT_EMAIL_SECRET, { expiresIn: '10m' });
}

export function signResetToken(payload) {
  return jwt.sign(payload, JWT_RESET_SECRET, { expiresIn: '10m' });
}

export function verifyRefreshToken(refreshToken) {
  try {
    return jwt.verify(refreshToken, JWT_REFRESH_SECRET);
  } catch (err) {
    throw new Error('Invalid or expired refresh token');
  }
}

export function verifyEmailToken(emailToken) {
  try {
    return jwt.verify(emailToken, JWT_EMAIL_SECRET);
  } catch (err) {
    throw new Error('Invalid or expired email verification token');
  }
}

export function verifyResetToken(resetToken) {
  try {
    return jwt.verify(resetToken, JWT_RESET_SECRET);
  } catch (err) {
    throw new Error('Invalid or expired reset token');
  }
}

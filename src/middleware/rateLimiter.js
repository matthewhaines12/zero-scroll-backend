// Express -> rate limiter -> Redis (shared counters) -> controller
import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes time window
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error:
      'Too many login attempts from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true, // Send standard rate limit headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
});

export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour time window, account creation rareer
  max: 3, // Limit each IP to 3 requests per windowMs
  message: {
    error: 'Too many accounts created from this IP. Try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

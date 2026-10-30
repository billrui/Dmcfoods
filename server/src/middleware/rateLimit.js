import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// Global API Limiter
// We increase the limit to 500 per minute to handle lunch rushes
// (Roughly 8 requests per second per IP)
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' },
  skip: (req) => {
    // Don't rate limit health checks
    return req.path === '/health';
  }
});

// Auth endpoints (login, register)
// Keep this strict. 10 attempts per 15 mins prevents brute-forcing passwords.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, try again later.' },
});

// Admin endpoints
// Admins legitimately make many requests (dashboard polls every 5s)
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many admin requests.' },
});

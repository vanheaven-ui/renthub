import { rateLimit } from 'express-rate-limit';

// Define the rate limiting rules for login attempts
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 failed login attempts per IP address
  message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // The 'skipSuccessfulRequests' option is useful for login, so a valid login won't count against the limit.
  // It's not available in older versions, so we'll skip it for now to avoid any issues.
});

// A stricter rate limiter for registration to prevent spam accounts
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Max 5 registration attempts per IP address
  message: 'Too many registration attempts from this IP, please try again after one hour.',
  standardHeaders: true,
  legacyHeaders: false,
});
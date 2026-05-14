const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = rateLimit;

// 20 AI calls per hour per user (identified by JWT userId or IP)
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req) => {
    const userId = req.user?.userId || req.user?.id;
    return userId ? `user:${userId}` : ipKeyGenerator(req);
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many AI requests. You are limited to 20 AI calls per hour. Please try again later.',
    retryAfter: 'See Retry-After header'
  },
  skip: (req) => req.user?.role === 'admin'
});

// General API rate limiter (200 requests per 15 minutes)
const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  keyGenerator: (req) => {
    const userId = req.user?.userId || req.user?.id;
    return userId ? `user:${userId}` : ipKeyGenerator(req);
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' }
});

module.exports = { aiRateLimiter, generalRateLimiter };

const rateLimit = require('express-rate-limit');

// General rate limiting for all routes - DISABLED
const generalLimiter = (req, res, next) => next(); // No-op middleware

// Stricter rate limiting for data-heavy routes - DISABLED
const strictLimiter = (req, res, next) => next(); // No-op middleware

// Very lenient rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  message: {
    error: 'Too many login attempts from this IP, please try again after 15 minutes.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many login attempts from this IP, please try again after 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

module.exports = {
  generalLimiter,
  strictLimiter,
  authLimiter
}; 
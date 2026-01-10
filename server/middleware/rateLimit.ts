import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  keyGenerator: (req) => req.ip || "unknown",
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Strict limit for writes
  message: { error: "Too many attempts. Chill." },
  keyGenerator: (req) => req.ip || "unknown",
});

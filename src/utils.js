import rateLimit from "express-rate-limit";
import jsonwebtoken from "jsonwebtoken";
import fetch from "node-fetch";

const ipBlacklist = new Map();

// 5 requests per 15 minutes
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  handler: (req, res) => {
    console.warn(`Login limit hit by IP: ${req.ip}`);
    const BLOCK_DURATION_MS = 15 * 60 * 1000;
    const blockExpiration = Date.now() + BLOCK_DURATION_MS;
    ipBlacklist.set(req.ip, blockExpiration);
    return res
      .status(429)
      .json({ msg: "Too many login attempts. Try again later." });
  },
});

// 300 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  handler: (req, res) => {
    console.warn(`Rate limit hit by IP: ${req.ip}`);
    return res.status(429).json({ msg: "Too many requests. Try again later." });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const blockIPs = (req, res, next) => {
  if (ipBlacklist.has(req.ip)) {
    const blockUntil = ipBlacklist.get(req.ip);
    if (Date.now() < blockUntil) {
      return res
        .status(429)
        .json({ msg: "Too many attempts. Try again later." });
    } else {
      ipBlacklist.delete(req.ip);
    }
  }
  next();
};

export const issueJWT = (user) => {
  const payload = {
    sub: user.user_id,
    iat: Math.floor(Date.now() / 1000),
  };
  const signedToken = jsonwebtoken.sign(payload, process.env.SECRET, {
    expiresIn: "1d",
  });

  return {
    token: "Bearer " + signedToken,
    expires: "1d",
  };
};

export const keepAlive = async () => {
  try {
    const response = await fetch("https://ib-api.onrender.com/");
    const status = await response.status;
    console.log(`Status Code: ${status}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};

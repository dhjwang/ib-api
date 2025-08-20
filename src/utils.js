import rateLimit from "express-rate-limit";
import jsonwebtoken from "jsonwebtoken";
import fetch from "node-fetch";

const ipBlacklist = new Map();

export const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  console.log(forwarded);
  if (forwarded) {
    const ips = forwarded.split(",");
    console.log(ips[0]);
    console.log(ips[0].trim());
    return ips[0].trim();
  }
  return req.ip;
};

// 5 requests per 15 minutes
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  handler: (req, res) => {
    const clientIp = getClientIp(req);
    console.warn(`Login limit hit by IP: ${clientIp}`);
    const BLOCK_DURATION_MS = 15 * 60 * 1000;
    const blockExpiration = Date.now() + BLOCK_DURATION_MS;
    ipBlacklist.set(clientIp, blockExpiration);
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
    const clientIp = getClientIp(req);
    console.warn(`Rate limit hit by IP: ${clientIp}`);
    return res.status(429).json({ msg: "Too many requests. Try again later." });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const blockIPs = (req, res, next) => {
  const clientIp = getClientIp(req);
  if (ipBlacklist.has(clientIp)) {
    const blockUntil = ipBlacklist.get(clientIp);
    if (Date.now() < blockUntil) {
      return res
        .status(429)
        .json({ msg: "Too many attempts. Try again later." });
    } else {
      ipBlacklist.delete(clientIp);
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

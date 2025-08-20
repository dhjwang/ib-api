import dotenv from "dotenv";
import express from "express";
import db from "./config/database.js";
import passport from "passport";
import "./strategies/jwt.js";
import users from "./routes/users.js";
import lobbies from "./routes/lobbies.js";
import scores from "./routes/scores.js";
import cors from "cors";
import bcrypt from "bcryptjs";
import helmet from "helmet";
import compression from "compression";
import {
  apiLimiter,
  loginLimiter,
  issueJWT,
  keepAlive,
  blockIPs,
  getClientIp,
} from "./utils.js";

dotenv.config();
const PORT = process.env.PORT || 3001;
db.query("SELECT 1", (err) => {
  if (err) {
    console.error("Unable to connect to DB:", err.message);
  } else {
    console.log("DB connected");
  }
});

const app = express();
app.set("trust proxy", 1);

app.use(express.json());
app.use(passport.initialize());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
  })
);
app.use(helmet());
app.use(compression());
app.use(apiLimiter);
app.use(blockIPs);

app.use("/api/users", users);
app.use("/api/lobbies", lobbies);
app.use("/api/scores", scores);

app.get("/", (req, res) => {
  res.status(200).send({ msg: "Server is running" });
});

// authenticate
app.post("/api/auth", loginLimiter, (req, res) => {
  const { username, password } = req.body;
  db.query(
    `SELECT * FROM users WHERE username = ?`,
    [username],
    (err, result) => {
      if (err) {
        console.error("DB Error on login:", err.message);
        return res.status(500).json({ msg: "Server Error" });
      } else if (result.length === 0) {
        return res.status(401).json({ msg: "Invalid credentials" });
      } else if (!bcrypt.compareSync(password, result[0].password)) {
        const clientIp = getClientIp(req);
        console.log(
          `Wrong password at IP: ${clientIp}, User: ${result[0].username}`
        );
        return res.status(401).json({ msg: "Invalid credentials" });
      } else {
        console.log(`User ${result[0].user_id}: ${result[0].username}`);
        const jwttoken = issueJWT(result[0]);
        return res.status(200).json({
          user: result[0].username,
          token: jwttoken.token,
          expires: jwttoken.expires,
        });
      }
    }
  );
});

// check authorization
app.get(
  "/api/auth/status",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    return res.status(200).json({ msg: "authorized" });
  }
);

app.listen(PORT, () => console.log(`Running on Port ${PORT}`));

if (process.env.NODE_ENV === "production") {
  setInterval(keepAlive, 600000);
}

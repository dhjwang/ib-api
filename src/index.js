import express from "express";
import db from "./config/database.js";
import passport from "passport";
import "./strategies/jwt.js";
import jsonwebtoken from "jsonwebtoken";
import users from "./routes/users.js";
import lobbies from "./routes/lobbies.js";
import scores from "./routes/scores.js";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";

db.on("connection", (connection) => {
  console.log("DB connected");
  connection.on("error", (err) => {
    console.error("MYSQL error");
  });
  connection.on("close", (err) => {
    console.error("MYSQL close");
  });
});

dotenv.config();

const app = express();
app.use(express.json());

app.use(passport.initialize());
app.use(
  cors({
    origin: "https://dhjwang.github.io",
  })
);

const PORT = process.env.PORT || 3001;

app.get("/", (req, res) => {
  // console.log(req.session);
  // console.log(req.session.id);
  // req.session.visited = true;
  res.status(201).send({ msg: "hello" });
});

app.use("/", users);
app.use("/", lobbies);
app.use("/", scores);

// authenticate
app.post("/api/auth", (req, res) => {
  const { username, password } = req.body;

  function issueJWT(user) {
    const payload = {
      id: user.user_id,
      issued: Date.now(),
    };

    const signedToken = jsonwebtoken.sign(payload, process.env.SECRET, {
      expiresIn: "1d",
    });

    return {
      token: "Bearer " + signedToken,
      expires: "1d",
    };
  }

  db.query(
    `SELECT * FROM users WHERE username = ?`,
    [username],
    (err, result) => {
      if (err) {
        console.log("could not get user, database error");
        return res.sendStatus(500);
      } else if (result.length === 0) {
        console.log(`User ${username} not found`);
        return res.sendStatus(404);
      } else if (!bcrypt.compareSync(password, result[0].password)) {
        console.log("Wrong password");
        return res.sendStatus(404);
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
    console.log(`status: auth`);
    res.status(200).json({ msg: "authorized" });
  }
);

app.listen(PORT, () => console.log(`Running on Port ${PORT}`));

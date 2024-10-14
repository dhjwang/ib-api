import express from "express";
import db from "./config/database.js";
import session from "express-session";
import passport from "passport";
import "./strategies/local.js";
import users from "./routes/users.js";
import lobbies from "./routes/lobbies.js";
import scores from "./routes/scores.js";
import dotenv from "dotenv";
import cors from "cors";

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
app.use(
  session({
    secret: process.env.SECRET,
    saveUninitialized: false,
    resave: false,
    rolling: true,
    cookie: { maxAge: 60000 * 15 },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(
  cors({
    origin: "https://dhjwang.github.io",
  })
);

const PORT = process.env.PORT || 3001;

app.get("/", (req, res) => {
  console.log(req.session);
  console.log(req.session.id);
  req.session.visited = true;
  res.status(201).send({ msg: "hello" });
});

app.use("/", users);
app.use("/", lobbies);
app.use("/", scores);

// const sessions = {};

// login
app.post("/api/auth", passport.authenticate("local"), (req, res) => {
  // sessions[req.session.id] = req.user[0];
  // console.log(sessions);

  if (req.user) {
    // res.send({ data: `${req.sessionID}` });
    res.send({ data: `${req.user[0]}` });
  } else {
    res.sendStatus(201);
  }
});

// check authorization
app.get("/api/auth/status", (req, res) => {
  console.log(`status:`);
  console.log(req.user);
  console.log(req.session);
  console.log(req.sessionID);
  if (req.user) return res.send(req.user);
  return res.sendStatus(201);
});

// logout
app.get("/api/auth/logout", (req, res) => {
  if (!req.user) return res.sendStatus(400);
  console.log(`user:`);
  console.log(req.user);
  req.logout((err) => {
    if (err) return res.sendStatus(400);
    return res.status(200).send({ msg: "logged out" });
  });
});

app.listen(PORT, () => console.log(`Running on Port ${PORT}`));

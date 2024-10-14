import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../config/database.js";

const router = Router();

// hash passwords
const hashPassword = (password) => {
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hashed = bcrypt.hashSync(password, salt);
  return hashed;
};

// add users
router.post("/api/users", (req, res) => {
  const { body } = req;
  body.password = hashPassword(body.password);
  db.query("INSERT INTO users SET ?", body, (err, results) => {
    if (err) {
      console.log(err);
      res.status(404).send({ msg: err.sqlMessage });
    } else {
      return res.status(201).send(results);
    }
  });
});

// check if username exists
router.get("/api/users/:username", (req, res) => {
  const {
    params: { username },
  } = req;

  db.query(
    `SELECT * FROM users WHERE username = '${username}'`,
    (err, results) => {
      if (err) {
        console.log(err);
        res.status(404).send({ msg: err.sqlMessage });
      } else if (!results.length) {
        res.status(201).send({ msg: "user does not exist" });
      } else {
        res.sendStatus(200);
      }
    }
  );
});

export default router;

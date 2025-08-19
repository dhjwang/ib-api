import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../config/database.js";

const router = Router();

const hashPassword = async (password) => {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(password, salt);
};

// add users
router.post("/", async (req, res) => {
  const { body } = req;
  if (!body.username?.trim().toLowerCase() || !body.password) {
    return res
      .status(400)
      .json({ msg: "Username and password cannot be empty" });
  }
  const user = {
    username: body.username,
    password: await hashPassword(body.password),
  };

  db.query("INSERT INTO users SET ?", user, (err, results) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ msg: "Username already taken" });
      }
      console.error(err.message);
      return res.status(500).json({ msg: err.message });
    } else {
      return res
        .status(201)
        .json({ userId: results.insertId, msg: "User created" });
    }
  });
});

export default router;

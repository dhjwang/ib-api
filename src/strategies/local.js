import passport from "passport";
import { Strategy } from "passport-local";
import db from "../config/database.js";
import bcrypt from "bcryptjs";

passport.serializeUser((user, done) => {
  console.log("serialize");
  console.log(user);
  done(null, user[0].user_id);
});

passport.deserializeUser((id, done) => {
  console.log("deserialize");

  db.query(`SELECT * FROM users WHERE user_id = ?`, [id], (err, result) => {
    if (err) {
      console.log("could not deserialize");
      return done(err, null);
    }
    if (result.length === 0) {
      console.log("user not found");
      return done(err, null);
    }
    return done(null, result);
  });
});

export default passport.use(
  new Strategy((username, password, done) => {
    db.query(
      `SELECT * FROM users WHERE username = ?`,
      [username],
      (err, result) => {
        if (err) {
          console.log("could not get user, server error");
          return done(err.message, null);
        }
        if (result.length === 0) return done(null, false);
        //   console.log("User not found");
        if (!bcrypt.compareSync(password, result[0].password))
          return done(null, false);
        // console.log("wrong password");
        done(null, result);
      }
    );
  })
);

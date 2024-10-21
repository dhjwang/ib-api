import passport from "passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import db from "../config/database.js";
import dotenv from "dotenv";

dotenv.config();

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.SECRET,
};

export default passport.use(
  new Strategy(options, (payload, done) => {
    db.query(
      `SELECT * FROM users WHERE user_id = ?`,
      [payload.id],
      (err, result) => {
        if (err) {
          console.log("could not get user, server error");
          return done(err.message, null);
        }
        if (result) {
          return done(null, result);
        } else {
          return done(null, false);
        }
      }
    );
  })
);

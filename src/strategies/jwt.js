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
      [payload.sub],
      (err, result) => {
        if (err) {
          console.error("JWT strategy DB error:", err.message);
          return done(err, false);
        }
        if (result.length > 0) {
          return done(null, result[0]);
        } else {
          return done(null, false);
        }
      }
    );
  })
);

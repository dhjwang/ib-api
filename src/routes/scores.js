import { Router } from "express";
import db from "../config/database.js";
import passport from "passport";

const router = Router();

// add score id
router.post(
  "/api/scores",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { body } = req;
    body.host_id = req.user[0].user_id;
    db.query(`INSERT INTO scores SET ? `, body, (err, results) => {
      if (err) {
        console.log(err);
        res.status(404).send({ msg: err.sqlMessage });
      } else {
        return res.status(201).send(results);
      }
    });
  }
);

// reset scores
router.put(
  "/api/scores/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const {
      query: { lobby },
      body,
    } = req;

    db.query(
      `UPDATE scores SET ?, updated_at = NOW() WHERE lobby_id = ${lobby} AND host_id = ${req.user[0].user_id}`,
      body,
      (err, results) => {
        if (err) {
          console.log(err);
          res.status(404).send({ msg: err.sqlMessage });
        } else {
          res.status(201).send(results);
        }
      }
    );
  }
);

// get scores for a lobby
router.get(
  "/api/scores/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const {
      params: { id },
    } = req;

    db.query(
      `SELECT * FROM scores WHERE lobby_id = ${id} AND host_id = ${req.user[0].user_id}`,
      (err, results) => {
        if (err) {
          console.log(err);
          res.status(404).send({ msg: err.sqlMessage });
        } else {
          res.status(200).send(results);
        }
      }
    );
  }
);

// update player score
router.put(
  "/api/scores/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const {
      params: { id },
      body,
    } = req;
    db.query(
      `UPDATE scores SET ?, updated_at = NOW() WHERE score_id = ${id} AND host_id = ${req.user[0].user_id}`,
      body,
      (err, results) => {
        if (err) {
          console.log(err);
          res.status(404).send({ msg: err.sqlMessage });
        } else {
          res.status(201).send(results);
        }
      }
    );
  }
);

//delete player score
router.delete(
  "/api/scores/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const {
      params: { id },
    } = req;

    db.query(
      `DELETE FROM scores WHERE score_id = ${id} AND host_id = ${req.user[0].user_id}`,
      (err, results) => {
        if (err) {
          console.log(err);
          res.status(404).send({ msg: err.sqlMessage });
        } else {
          res.status(201).send(results);
        }
      }
    );
  }
);

export default router;

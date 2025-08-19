import { Router } from "express";
import db from "../config/database.js";
import passport from "passport";

const router = Router();

// add score id
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { body } = req;
    db.query(
      `INSERT INTO scores (player_name, lobby_id)
      SELECT ?,?
      FROM lobbies
      WHERE lobby_id = ? AND host_id = ?; `,
      [body.player_name, body.lobby_id, body.lobby_id, req.user.user_id],
      (err, result) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send({ msg: err.message });
        } else if (result.affectedRows === 0) {
          return res.status(404).send({ msg: "Lobby not found" });
        } else {
          return res.status(201).send({
            newPlayer: {
              player_name: body.player_name,
              player_score: 0,
              score_id: result.insertId,
            },
          });
        }
      }
    );
  }
);

// reset scores
router.put(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { lobbyId } = req.query;

    db.query(
      `UPDATE scores
      JOIN lobbies ON scores.lobby_id = lobbies.lobby_id
      SET player_score = 0, scores.updated_at = NOW()
      WHERE scores.lobby_id = ? AND lobbies.host_id = ?`,
      [lobbyId, req.user.user_id],
      (err, results) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send({ msg: err.message });
        } else {
          return res
            .status(200)
            .send({ msg: "Scores reset", affectedRows: results.affectedRows });
        }
      }
    );
  }
);

// get scores for a lobby
router.get(
  "/:lobbyId",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { lobbyId } = req.params;
    db.query(
      `SELECT scores.* FROM scores JOIN lobbies ON scores.lobby_id = lobbies.lobby_id WHERE scores.lobby_id = ? AND lobbies.host_id = ?`,
      [lobbyId, req.user.user_id],
      (err, results) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send({ msg: err.message });
        } else {
          return res.status(200).send(results);
        }
      }
    );
  }
);

// update player score
router.put(
  "/:scoreId",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const {
      params: { scoreId },
      body,
    } = req;
    db.query(
      `UPDATE scores
      JOIN lobbies ON scores.lobby_id = lobbies.lobby_id
      SET scores.player_score = ?, scores.updated_at = NOW()
      WHERE scores.score_id = ? AND lobbies.host_id = ?`,
      [body.player_score, scoreId, req.user.user_id],
      (err, results) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send({ msg: err.message });
        } else {
          return res
            .status(200)
            .send({ msg: "Score updated", affectedRows: results.affectedRows });
        }
      }
    );
  }
);

//delete player score
router.delete(
  "/:scoreId",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { scoreId } = req.params;

    db.query(
      `DELETE scores FROM scores
      JOIN lobbies ON scores.lobby_id = lobbies.lobby_id
      WHERE scores.score_id = ? AND lobbies.host_id = ?`,
      [scoreId, req.user.user_id],
      (err, result) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send({ msg: err.message });
        } else if (result.affectedRows === 0) {
          return res.status(404).send({ msg: "Player not found" });
        } else {
          return res.status(200).send({ msg: "Player deleted" });
        }
      }
    );
  }
);

export default router;

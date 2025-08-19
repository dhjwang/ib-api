import { Router } from "express";
import db from "../config/database.js";
import passport from "passport";

const router = Router();

// Id validation middleware
const validateLobbyId = (req, res, next) => {
  const { lobbyId } = req.params;
  const parsedId = parseInt(lobbyId);
  if (isNaN(parsedId)) return res.status(400).send({ msg: "ID not valid" });

  db.query(
    `SELECT * FROM lobbies WHERE lobby_id = ? AND host_id = ?`,
    [lobbyId, req.user.user_id],
    (err, results) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send({ msg: err.message });
      } else if (!results.length) {
        return res.status(404).send({ msg: "No ID found" });
      } else {
        req.lobbyId = lobbyId;
        req.lobby = results[0];
        next();
      }
    }
  );
};

// get lobbies for user id
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    db.query(
      `SELECT lobbies.*, COALESCE(nplayers.players,0) as players FROM lobbies 
      LEFT JOIN (SELECT lobby_id,COUNT(*) as players FROM scores GROUP BY lobby_id ) as nplayers
      ON lobbies.lobby_id = nplayers.lobby_id
      WHERE lobbies.host_id = ?;`,
      [req.user.user_id],
      (err, results) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send({ msg: err.message });
        } else {
          return res
            .status(200)
            .send({ username: req.user.username, lobbies: results });
        }
      }
    );
  }
);

// add new lobby
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const lobbyData = {
      ...req.body,
      host_id: req.user.user_id,
    };
    db.query(`INSERT INTO lobbies SET ?`, lobbyData, (err, result) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send({ msg: err.message });
      } else {
        const newLobbyId = result.insertId;
        db.query(
          `SELECT lobbies.*, COALESCE(nplayers.players,0) as players FROM lobbies 
          LEFT JOIN (SELECT lobby_id,COUNT(*) as players FROM scores GROUP BY lobby_id ) as nplayers
          ON lobbies.lobby_id = nplayers.lobby_id
          WHERE lobbies.lobby_id = ? AND lobbies.host_id = ?;`,
          [newLobbyId, req.user.user_id],
          (err, results) => {
            if (err) {
              console.error(err.message);
              return res.status(500).send({ msg: err.message });
            } else {
              return res.status(201).send({ newLobby: results[0] });
            }
          }
        );
      }
    });
  }
);

// get a specific lobby
router.get(
  "/:lobbyId",
  passport.authenticate("jwt", { session: false }),
  validateLobbyId,
  (req, res) => {
    return res.status(200).send(req.lobby);
  }
);

// update lobby round
router.put(
  "/:lobbyId",
  passport.authenticate("jwt", { session: false }),
  validateLobbyId,
  (req, res) => {
    const { lobbyId, body } = req;

    db.query(
      `UPDATE lobbies SET ?, updated_at = NOW() WHERE lobby_id = ?`,
      [body, lobbyId],
      (err, results) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send({ msg: err.message });
        } else {
          return res
            .status(200)
            .send({ msg: "Lobby updated", affectedRows: results.affectedRows });
        }
      }
    );
  }
);

// delete lobby
router.delete(
  "/:lobbyId",
  passport.authenticate("jwt", { session: false }),
  validateLobbyId,
  (req, res) => {
    const { lobbyId } = req;

    db.query(
      `DELETE FROM lobbies WHERE lobby_id = ?`,
      [lobbyId],
      (err, result) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send({ msg: err.message });
        } else if (result.affectedRows === 0) {
          return res.status(404).send({ msg: "Lobby not found" });
        } else {
          return res.status(200).send({ msg: "Lobby deleted" });
        }
      }
    );
  }
);

export default router;

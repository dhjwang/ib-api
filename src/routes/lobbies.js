import { Router } from "express";
import db from "../config/database.js";
import passport from "passport";

const router = Router();

// Id validation middleware
const validateId = (req, res, next) => {
  const {
    params: { id },
  } = req;

  const parsedId = parseInt(id);
  if (isNaN(parsedId)) return res.status(400).send({ msg: "ID not valid" });

  db.query(`SELECT * FROM lobbies WHERE lobby_id = ${id}`, (err, results) => {
    if (err) {
      console.log(err);
      res.status(404).send({ msg: err.sqlMessage });
    } else if (!results.length) {
      res.status(404).send({ msg: "ID not valid" });
    } else {
      req.lobbyId = id;
      next();
    }
  });
};

// get lobbies for user id
router.get(
  "/api/lobbies",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const {
      query: { filter, value },
    } = req;
    if (filter && value) {
      db.query(
        `SELECT * FROM lobbies WHERE ${filter} = '${value}'`,
        (err, results) => {
          if (err) {
            console.log(err);
            res.status(404).send({ msg: err.sqlMessage });
          } else {
            res.status(201).send(results);
          }
        }
      );
    } else {
      db.query(
        `SELECT lobbies.*, COALESCE(nplayers.players,0) as players FROM lobbies 
      LEFT JOIN (SELECT lobby_id,COUNT(*) as players FROM scores GROUP BY lobby_id ) as nplayers
      ON lobbies.lobby_id = nplayers.lobby_id
      WHERE lobbies.host_id = ${req.user[0].user_id};`,

        (err, results) => {
          if (err) {
            console.log(err);
            res.status(404).send({ msg: err.sqlMessage });
          } else {
            res
              .status(201)
              .send({ username: req.user[0].username, lobbies: results });
          }
        }
      );
    }
  }
);

// add new lobby
router.post(
  "/api/lobbies",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { body } = req;

    db.query(
      `INSERT INTO lobbies SET ?, host_id = ${req.user[0].user_id}`,
      body,
      (err, results) => {
        if (err) {
          console.log(err);
          res.status(404).send({ msg: err.sqlMessage });
        } else {
          db.query(
            `SELECT lobbies.*, COALESCE(nplayers.players,0) as players FROM lobbies 
          LEFT JOIN (SELECT lobby_id,COUNT(*) as players FROM scores GROUP BY lobby_id ) as nplayers
          ON lobbies.lobby_id = nplayers.lobby_id
          WHERE lobbies.host_id = ${req.user[0].user_id};`,
            (err, results) => {
              if (err) {
                console.log(err);
                res.status(404).send({ msg: err.sqlMessage });
              } else {
                res
                  .status(201)
                  .send({ username: req.user[0].username, lobbies: results });
              }
            }
          );
        }
      }
    );
  }
);

// get a specific lobby
router.get(
  "/api/lobbies/:id",
  validateId,
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { lobbyId } = req;

    db.query(
      `SELECT * FROM lobbies WHERE lobby_id = '${lobbyId}' AND host_id = ${req.user[0].user_id}`,
      (err, results) => {
        if (err) {
          console.log(err);
          res.status(404).send({ msg: err.sqlMessage });
        } else if (!results.length) {
          res.status(404).send({ msg: "user does not exist" });
        } else {
          res.sendStatus(200);
        }
      }
    );
  }
);

// update lobby round
router.put(
  "/api/lobbies/:id",
  validateId,
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { lobbyId, body } = req;

    db.query(
      `UPDATE lobbies SET ?, updated_at = NOW() WHERE lobby_id = ${lobbyId} AND host_id = ${req.user[0].user_id}`,
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

// delete lobby
router.delete(
  "/api/lobbies/:id",
  validateId,
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { lobbyId } = req;

    db.query(
      `DELETE FROM lobbies WHERE lobby_id = ${lobbyId} AND host_id = ${req.user[0].user_id}`,
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

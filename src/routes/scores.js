import { Router } from "express";
import db from "../config/database.js";

const router = Router();

// add score id
router.post("/api/scores", (req, res) => {
  const { body } = req;
  if (!req.user) return res.sendStatus(401);

  db.query(`INSERT INTO scores SET ?`, body, (err, results) => {
    if (err) {
      console.log(err);
      res.status(404).send({ msg: err.sqlMessage });
    } else {
      return res.status(201).send(results);
    }
  });
});

// reset scores
router.put("/api/scores/", (req, res) => {
  const {
    query: { lobby },
    body,
  } = req;

  db.query(
    `UPDATE scores SET ?, updated_at = NOW() WHERE lobby_id = ${lobby}`,
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
});

// get scores for a lobby
router.get("/api/scores/:id", (req, res) => {
  const {
    params: { id },
  } = req;

  db.query(`SELECT * FROM scores WHERE lobby_id = ${id}`, (err, results) => {
    if (err) {
      console.log(err);
      res.status(404).send({ msg: err.sqlMessage });
    } else {
      res.status(200).send(results);
    }
  });
});

// update player score
router.put("/api/scores/:id", (req, res) => {
  const {
    params: { id },
    body,
  } = req;
  db.query(
    `UPDATE scores SET ?, updated_at = NOW() WHERE score_id = ${id}`,
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
});

//delete player score
router.delete("/api/scores/:id", (req, res) => {
  const {
    params: { id },
  } = req;

  db.query(`DELETE FROM scores WHERE score_id = ${id}`, (err, results) => {
    if (err) {
      console.log(err);
      res.status(404).send({ msg: err.sqlMessage });
    } else {
      res.status(201).send(results);
    }
  });
});

export default router;

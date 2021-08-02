const express = require('express');
const bcrypt = require('bcrypt');

const dbPool = require("../modules/db");
const {ensureServerAuthenticated} = require("../modules/auth");

const saltRounds = 5;
const router = express.Router();

router.get("/highscoreList", async (req, res) => {
    let count = 10;
    if (req.query.count !== undefined) {
        count = req.query.count;
    }

    console.log(`${req.ip} requested ${count} highscore entries`);

    try {
        const [rows] = await dbPool.execute(
            "SELECT u.nickname, h.time, h.score FROM users AS u, highscores AS h WHERE u.uid = h.user_id ORDER BY h.score DESC LIMIT ?",
            [count]
        );

        res.send(rows);
    } catch (e) {
        console.log(e.toString());

        res.status(500);
        res.send(e.toString());
    }
});

router.post("/newUser", async (req, res) => {
    const email = req.body.email;
    const nickname = req.body.name;
    const password = req.body.password;

    // Check if email address exists in database
    const [emails] = await dbPool.execute("SELECT email FROM users WHERE email = ?", [email]);
    if (emails.length > 0) {
        res.status(400);
        res.send({error: "Email already exists"});
        return;
    }

    bcrypt.hash(password, saltRounds, async (err, passHash) => {
        if (err) {
            console.log(err);
            return;
        }

        try {
            await dbPool.execute(
                "INSERT INTO users (nickname, password, email) VALUES (?, ?, ?)",
                [nickname, passHash, email]
            );

            // Confirm insertion to requester
            res.status(201);
            res.send();
        } catch (err) {
            console.log(err);

            res.status(500);
            res.send({error: err.toString()});
        }
    });
});

router.post("/addHighscore", ensureServerAuthenticated, async (req, res) => {
    req
});

module.exports = router;
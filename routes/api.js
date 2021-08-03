const express = require('express');
const bcrypt = require('bcrypt');

const dbPool = require("../modules/db");
const {ensureServerAuthenticated} = require("../modules/auth");

const saltRounds = 5;
const router = express.Router();

router.get("/highscore-list", async (req, res) => {
    let count = req.query.count;

    console.log(`${req.ip} requested ${count ? count : "all"} highscore entries`);

    const baseQuery = "SELECT u.nickname, h.time, h.score FROM users AS u, highscores AS h WHERE u.uid = h.user_id ORDER BY h.score DESC, h.time DESC";

    try {
        let rows;
        if (count) {
            [rows] = await dbPool.execute(
                `${baseQuery} LIMIT ?`,
                [count]
            );
        } else {
            [rows] = await dbPool.execute(baseQuery);
        }

        res.send(rows);
    } catch (e) {
        console.log(e.toString());

        res.sendStatus(500);
    }
});

router.post("/new-user", async (req, res) => {
    const email = req.body.email;
    const nickname = req.body.name;
    const password = req.body.password;

    if (email === undefined || nickname === undefined || password === undefined) {
        res.status(400);
        res.send({error: "Not all fields were present"});
        return;
    }

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

router.post("/add-highscore", ensureServerAuthenticated, async (req, res) => {
    if (!req.body.user_id || !req.body.score) {
        res.sendStatus(400);
    }

    const userId = req.body.user_id;
    const highscore = req.body.score;

    try {
        await dbPool.execute("INSERT INTO highscores (user_id, time, score) VALUES (?, ?, ?)",
            [userId, Date.now(), highscore]
        );

        res.sendStatus(201);
    } catch (err) {
        console.log(err);

        res.status(500);
        res.send({error: err.toString()});
    }
});

router.get("/stats", async (req, res) => {
    try {
        const [topScore] = await dbPool.execute(
            "SELECT u.nickname, h.user_id, h.score, h.time " +
            "FROM highscores AS h " +
            "INNER JOIN users AS u ON u.uid = h.user_id " +
            "WHERE h.score = (SELECT MAX(score) FROM highscores) " + // Select the max and use it as the filter
            "ORDER BY h.time DESC" // In case there are more than one, return the newest
        );

        const [count] = await dbPool.execute("SELECT COUNT(time) AS total FROM highscores");

        // Calculate the timestamp 1 month ago
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        const oneMonthAgo = d.getTime();

        const [monthlyBest] = await dbPool.execute(
            "SELECT u.nickname, h.user_id, h.score, h.time " +
            "FROM highscores AS h " +
            "INNER JOIN users AS u ON u.uid = h.user_id " +
            "WHERE h.score = (SELECT MAX(score) FROM highscores WHERE time > ?) AND h.time > ? " + // Select the max and use it as the filter
            "ORDER BY h.time DESC", // In case there are more than one, return the newest first
            [oneMonthAgo, oneMonthAgo]
        );

        const [monthlyCount] = await dbPool.execute("SELECT COUNT(time) AS total FROM highscores WHERE time > ?", [oneMonthAgo]);

        res.send({
            top_score: topScore[0],
            total_scores: count[0].total,
            monthly_top: monthlyBest[0],
            monthly_plays: monthlyCount[0].total
        });
    } catch (e) {
        res.sendStatus(500);
        throw e;
    }
});

module.exports = router;
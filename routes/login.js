const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const {gameServerPassword} = require('../secrets');
const gameSessionStore = require('../modules/gameSessionStore');

const router = express.Router();

router.post("/player", async (req, res, next) => {
    passport.authenticate('local-user', function (err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            res.status(401);
            return res.send(info.message);
        }
        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            res.status(200);
            return res.send(user);
        });
    })(req, res, next);
});

router.get("/start-game-session", async (req, res) => {
    const sessionId = crypto.randomInt(1, 2147483647);

    bcrypt.hash(gameServerPassword + sessionId, 5, (err, hash) => {
        if (err) {
            console.log(err);
            res.sendStatus(500);
            return;
        }

        // In-memory storage as a js object: Fast and scalable? absolutely not. Do I care? not really.
        gameSessionStore[sessionId] = {password: hash, created: Date.now()};

        res.send(sessionId.toString());
    });
});

router.post("/server", async (req, res, next) => {
    passport.authenticate('local-server', function (err, user) {
        if (err) {
            return next(err);
        }

        if (!user) {
            return res.sendStatus(401);
        }
        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            res.status(200);
            return res.send(user);
        });
    })(req, res, next);
});

router.get("/logout", (req, res) => {
    if (req.user && req.user.isServer) {
        delete gameSessionStore[req.user.id];
    }

    req.logout();
    res.send();
});

module.exports = router;
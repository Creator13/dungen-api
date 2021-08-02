const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');

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
    const sessionId = Date.now();

    bcrypt.hash(gameServerPassword + sessionId, 5, (err, hash) => {
        if (err) {
            console.log(err);
            res.status(500);
            res.send();
            return;
        }

        // In-memory storage as a js object: Fast and scalable? absolutely not. Do I care? not really.
        gameSessionStore[sessionId] = {password: hash, isServer: true};

        res.send({id: sessionId});
    });
});

router.post("/server", async (req, res, next) => {
    passport.authenticate('local-server', function (err, user) {
        if (err) {
            return next(err);
        }

        if (!user) {
            res.status(401);
            return res.send();
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

router.post("/logout", (req, res) => {
    req.logout();
    res.send();
});

module.exports = router;
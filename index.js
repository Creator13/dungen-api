const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const connectionData = require(path.resolve(__dirname, "./connectionData.js"));

const port = process.env.PORT || 80;
const saltRounds = 5;

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(session({
    secret: "89dj2389edkwejsajdfker5-0ul<<sdd",
    saveUninitialized: true,
    cookie: {maxAge: 1000 * 60 * 60},
    resave: false
}));

let dbPool = mysql.createPool(connectionData);

const users = {};

passport.use('local-user', new LocalStrategy(
    {usernameField: 'email'},
    async function (email, password, done) {
        try {
            const [queryResults] = await dbPool.execute('SELECT password, uid, nickname FROM users WHERE email = ?', [email]);

            // console.log(queryResults[0]);
            //
            // return done(null, false);

            // No user found
            if (queryResults.length === 0) {
                console.log("no user found");
                return done(null, false);
            }

            const userData = queryResults[0];

            // Compare passwords
            await bcrypt.compare(password, userData.password, (err, result) => {
                if (err) {
                    return done(err);
                }

                if (result) {

                    const user = {
                        id: userData.uid,
                        nickname: userData.nickname,
                        email: email
                    };

                    users[user.id] = user;

                    console.log("logged in");
                    console.log(user);

                    return done(null, user);
                } else {
                    console.log("passwords didn't match");
                    return done(null, false);
                }
            });
        } catch (err) {
            console.log("yo do u even do this");
            return done(err, false);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    done(null, users[id]);
});

app.use(passport.initialize());
app.use(passport.session());

app.post("/api/newUser", async (req, res) => {
    const email = req.body.email;
    const nickname = req.body.name;
    const password = req.body.password;

    bcrypt.hash(password, saltRounds, async (err, passHash) => {
        if (err) {
            console.log(err);
        } else {
            try {
                // Check if email address exists in database
                const [emails] = await dbPool.execute("SELECT email FROM users WHERE email = ?", [email]);
                if (emails.length > 0) {
                    res.status(400);
                    res.send({error: "Email already exists"});

                    return;
                }

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
        }
    });
});

app.post("/login/player", passport.authenticate('local-user'), async (req, res) => {
    console.log(`This one is logged in: !`, req.user);
    res.send();
});

app.post("/login/server");

app.get("/secretRoute", ensureAuthenticated, async (req, res) => {
    res.send("u found the secret pag!!");
});

app.get("/api/highscoreList", async (req, res) => {
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

app.listen(port, () => {
    console.log("Now listening on port " + port);
});

function ensureAuthenticated(req, res, next) {
    if (req.user) {
        next();
    }
    else {
        res.status(401);
        res.send("Unauthorized");
    }
}
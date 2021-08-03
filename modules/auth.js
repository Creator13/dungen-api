const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require('bcrypt');

const dbPool = require('./db');
const users = require('./userStore');
const sessions = require('./gameSessionStore');

passport.use('local-user', new LocalStrategy(
    {usernameField: 'email'},
    async function (email, password, done) {
        try {
            const [queryResults] = await dbPool.execute('SELECT password, uid, nickname FROM users WHERE email = ?', [email]);

            // No user found
            if (queryResults.length === 0) {
                console.log("no user found");
                return done(null, false, {message: "User not found"});
            }

            const userData = queryResults[0];

            // Compare passwords
            await bcrypt.compare(password, userData.password, (err, result) => {
                if (err) {
                    return done(err);
                }

                if (result) {
                    // Passwords match, create and send user
                    const user = {
                        id: userData.uid,
                        nickname: userData.nickname,
                        email: email,
                        isUser: true
                    };

                    users[user.id] = user;

                    return done(null, user);
                } else {
                    // Wrong password
                    return done(null, false, {message: "Invalid password"});
                }
            });
        } catch (err) {
            return done(err, false);
        }
    }
));

passport.use('local-server', new LocalStrategy(
    {usernameField: "game-session"},
    function (session, password, done) {
        if (sessions[session] !== undefined) {
            bcrypt.compare(password + session, sessions[session].password, (err, result) => {
                if (err) {
                    return done(err);
                }

                if (result) {
                    const gameServer = {
                        id: session,
                        password: sessions[session].password,
                        isServer: true
                    };

                    sessions[session] = gameServer;

                    return done(null, gameServer);
                } else {
                    return done(null, false);
                }
            });
        }
        else {
            return done(null, false);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, `${user.isUser ? 'u' : 's'}${user.id}`);
});

passport.deserializeUser((id, done) => {
    const type = id.substring(0, 1);
    id = id.substring(1);

    if (type === 'u') {
        done(null, users[id]);
    } else if (type === 's') {
        done(null, sessions[id]);
    }
});

module.exports.ensureUserAuthenticated = function (req, res, next) {
    if (!req.user) {
        res.status(401);
        res.send("Unauthorized");
        return;
    }

    if (req.user.isUser) {
        next();
    }
    else {
        res.status(403);
        res.send("Forbidden");
    }
};

module.exports.ensureServerAuthenticated = function (req, res, next) {
    if (!req.user) {
        res.status(401);
        res.send("Unauthorized");
        return;
    }

    if (req.user.isServer) {
        next();
    }
    else {
        res.status(403);
        res.send("Forbidden");
    }
};
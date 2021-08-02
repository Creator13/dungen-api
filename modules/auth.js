const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require('bcrypt');

const dbPool = require('./db');
const users = require('./userStore');

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

module.exports.ensureAuthenticated = function (req, res, next) {
    if (req.user) {
        next();
    } else {
        res.status(401);
        res.send("Unauthorized");
    }
};
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const {ensureAuthenticated} = require("./modules/auth");

const port = process.env.PORT || 80;

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(session({
    secret: "89dj2389edkwejsajdfker5-0ul<<sdd",
    saveUninitialized: true,
    cookie: {maxAge: 1000 * 60 * 60},
    resave: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/login', require("./routes/login"));
app.use('/api', require("./routes/api"));

app.get("/secretRoute", ensureAuthenticated, async (req, res) => {
    res.send("u found the secret pag!!");
});

app.listen(port, () => {
    console.log("Now listening on port " + port);
});
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const {ensureUserAuthenticated, ensureServerAuthenticated} = require("./modules/auth");
const path = require('path');

const port = process.env.PORT || 80;
const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(session({
    secret: "89dj2389edkwejsajdfker5-0ul<<sdd",
    saveUninitialized: true,
    cookie: {maxAge: 1000 * 60 * 60 * 6},
    resave: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, "static")));

app.use('/login', require("./routes/login"));
app.use('/api', require("./routes/api"));

app.get("/secretRoute", ensureUserAuthenticated, async (req, res) => {
    res.send("u found the secret pag!!");
});

app.get("/secretServerRoute", ensureServerAuthenticated, async (req, res) => {
    res.send("are u a servr?!!");
});

app.listen(port, () => {
    console.log("Now listening on port " + port);
});
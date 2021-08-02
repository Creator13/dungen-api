const express = require('express');
const passport = require('passport');

const router = express.Router();

router.post("/player", passport.authenticate('local-user'), async (req, res) => {
    console.log(`This one is logged in: !`, req.user);
    res.send();
});

router.post("/server");

module.exports = router;
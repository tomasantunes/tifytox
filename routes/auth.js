var express = require('express');
var database = require('../libs/database');
var secretConfig = require('../secret-config');
var router = express.Router();

var {con, con2 } = database.getMySQLConnections();

router.post("/api/check-login", (req, res) => {
  var user = req.body.user;
  var pass = req.body.pass;

  var sql = "SELECT * FROM logins WHERE is_valid = 0 AND created_at > (NOW() - INTERVAL 1 HOUR);";

  con.query(sql, function (err, result) {
    if (err) {
      console.log(err);
      res.json({status: "NOK", error: err.message});
      return;
    }
    if (result.length <= 5) {
      if (user == secretConfig.USER && pass == secretConfig.PASS) {
        req.session.isLoggedIn = true;
        var sql2 = "INSERT INTO logins (is_valid) VALUES (1);";
        con.query(sql2);
        res.json({status: "OK", data: "Login successful."});
      }
      else {
        var sql2 = "INSERT INTO logins (is_valid) VALUES (0);";
        con.query(sql2);
        res.json({status: "NOK", error: "Wrong username/password."});
      }
    }
    else {
      res.json({status: "NOK", error: "Too many login attempts."});
    }
  });
});

router.post("/check-login", (req, res) => {
  if (req.session.isLoggedIn) {
    res.json({status: "OK"});
  }
  else {
    res.json({status: "NOK"});
  }
});

module.exports = router;

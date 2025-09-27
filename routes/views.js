var express = require('express');
var router = express.Router();
var path = require('path');

router.get('/home', function(req, res) {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

router.get('/login', function(req, res) {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

module.exports = router;
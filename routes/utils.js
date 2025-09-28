var express = require('express');
var router = express.Router();
var {con2} = require('../libs/database').getMySQLConnections();

router.post('/get-temp-logs', async function(req, res) {
  if (!req.session.isLoggedIn) {
    return res.json({ status: "NOK", error: 'Invalid Authorization.' });
  }

  try {
    const [rows] = await con2.execute("SELECT * FROM temp_logs");
    await con2.execute("DELETE FROM temp_logs");
    res.json({ status: "OK", data: rows });
  } catch (error) {
    console.error("Error fetching temporary errors:", error);
    res.json({ status: "NOK", error: 'Failed to fetch temporary errors.' });
  }
});

module.exports = router;
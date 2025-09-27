var express = require('express');
var router = express.Router();
var axios = require('axios');
var { generateRandomString } = require('../libs/utils');
var { getMySQLConnections } = require('../libs/database');
var { getRefreshToken } = require('../libs/spotify');
var { backgroundErrorLogger } = require('../libs/utils');
var secretConfig = require('../secret-config');

var {con2} = getMySQLConnections();

router.get('/spotify/login', async function(req, res) {
  if (!req.session.isLoggedIn) {
    return res.json({ status: "OK", error: 'Invalid Authorization.' });
  }

  var state = generateRandomString(16);
  var scope = 'user-read-playback-state';

  var params = new URLSearchParams({
    response_type: 'code',
    client_id: secretConfig.SPOTIFY_CLIENT_ID,
    scope: scope,
    redirect_uri: secretConfig.SPOTIFY_REDIRECT_URI,
    state: state
  });

  var queryString = params.toString();

  res.redirect('https://accounts.spotify.com/authorize?' + queryString);  
});

router.post('/spotify/refresh-login', function(req, res) {
  if (!req.session.isLoggedIn) {
    return res.json({ status: "OK", error: 'Invalid Authorization.' });
  }

  let refresh_token = req.body.refresh_token;

  if (!refresh_token) {
    return res.json({ status: "NOK", error: 'No refresh token provided.' });
  }

  getRefreshToken(refresh_token).then((result) => {
    if (result) {
      res.json({ status: "OK", message: 'Token refreshed successfully.' });
    } else {
      res.json({ status: "NOK", error: 'Failed to refresh token.' });
    }
  });
});

router.get("/auth-callback", async function (req, res) {
  let code = req.query.code || null;
  let state = req.query.state || null;

  if (state === null) {
    console.log("State is null");
    await backgroundErrorLogger("Unable to authenticate with Spotify.");
    res.redirect("/");
  } else {
    try {
      const body = new URLSearchParams({
        code: code,
        redirect_uri: secretConfig.SPOTIFY_REDIRECT_URI,
        grant_type: "authorization_code",
      });

      const tokenResponse = await axios.post(
        "https://accounts.spotify.com/api/token",
        body.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization:
              "Basic " +
              Buffer.from(secretConfig.SPOTIFY_CLIENT_ID + ":" + secretConfig.SPOTIFY_CLIENT_SECRET).toString("base64"),
          },
        }
      );

      const tokens = tokenResponse.data;

      await con2.execute(
        "INSERT INTO tokens (access_token, refresh_token) VALUES (?, ?)",
        [tokens.access_token, tokens.refresh_token]
      );

      console.log("Tokens saved to database.");
      res.redirect("/");
    } catch (error) {
      console.log("Error on auth-callback:" + (error.response?.data || error.message));
      await backgroundErrorLogger("Unable to authenticate with Spotify.");
      res.redirect("/");
    }
  }
});

module.exports = router;
var express = require('express');
var router = express.Router();
var querystring = require('querystring');
var { generateRandomString } = require('../libs/utils');
var { getMySQLConnections } = require('../libs/database');
var { getRefreshToken } = require('../libs/spotify');
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
  const code = req.query.code || null;
  const state = req.query.state || null;

  if (state === null) {
    const errorParams = new URLSearchParams({ error: "state_mismatch" });
    res.redirect("/");
  } else {
    try {
      const body = new URLSearchParams({
        code: code,
        redirect_uri: redirect_uri,
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
              Buffer.from(client_id + ":" + client_secret).toString("base64"),
          },
        }
      );

      const tokens = tokenResponse.data;

      await con2.execute(
        "INSERT INTO tokens (access_token, refresh_token) VALUES (?, ?)",
        [tokens.access_token, tokens.refresh_token]
      );

      const redirectParams = new URLSearchParams({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });

      res.redirect("/");
    } catch (error) {
      console.error(error.response?.data || error.message);

      const errorParams = new URLSearchParams({ error: "invalid_token" });
      res.redirect("/");
    }
  }
});

module.exports = router;
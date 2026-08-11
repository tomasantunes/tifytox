var express = require('express');
var router = express.Router();
var axios = require('axios');
var { generateRandomString } = require('../libs/utils');
var { getMySQLConnections } = require('../libs/database');
var { getRefreshToken } = require('../libs/spotify');
var { backgroundLogger } = require('../libs/utils');
var secretConfig = require('../secret-config');

var {con2} = getMySQLConnections();

router.get('/spotify/login', async function(req, res) {
  if (!req.session.isLoggedIn) {
    return res.json({ status: "OK", error: 'Invalid Authorization.' });
  }

  var state = generateRandomString(16);
  var scope = 'user-read-playback-state playlist-read-private playlist-read-collaborative';

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

async function getLatestTokens() {
  const [rows] = await con2.execute(
    "SELECT access_token, refresh_token FROM tokens ORDER BY created_at DESC LIMIT 1"
  );
  return rows[0] || null;
}

async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    body.toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(
          secretConfig.SPOTIFY_CLIENT_ID + ":" + secretConfig.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
      },
    }
  );

  const nextRefreshToken = response.data.refresh_token || refreshToken;
  await con2.execute(
    "INSERT INTO tokens (access_token, refresh_token) VALUES (?, ?)",
    [response.data.access_token, nextRefreshToken]
  );
  return response.data.access_token;
}

async function spotifyGet(url) {
  const tokens = await getLatestTokens();
  if (!tokens) {
    const error = new Error("Spotify is not connected.");
    error.status = 401;
    throw error;
  }

  try {
    return await axios.get(url, {
      headers: { Authorization: "Bearer " + tokens.access_token },
    });
  } catch (error) {
    if (error.response?.status !== 401 || !tokens.refresh_token) throw error;
    const accessToken = await refreshAccessToken(tokens.refresh_token);
    return axios.get(url, {
      headers: { Authorization: "Bearer " + accessToken },
    });
  }
}

async function getAllPages(url) {
  const items = [];
  let next = url;

  while (next) {
    const response = await spotifyGet(next);
    items.push(...(response.data.items || []));
    next = response.data.next;
  }

  return items;
}

function requireAppLogin(req, res, next) {
  if (!req.session.isLoggedIn) {
    return res.status(401).json({ status: "NOK", error: "Invalid authorization." });
  }
  next();
}

router.get("/spotify/playlists", requireAppLogin, async function (req, res) {
  try {
    const playlists = await getAllPages(
      "https://api.spotify.com/v1/me/playlists?limit=50"
    );
    res.json({
      status: "OK",
      data: playlists.map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        image: playlist.images?.[0]?.url || null,
        trackCount: playlist.tracks?.total || 0,
      })),
    });
  } catch (error) {
    const status = error.status || error.response?.status || 500;
    console.error("Error fetching Spotify playlists:", error.response?.data || error.message);
    res.status(status).json({
      status: "NOK",
      error: status === 401 || status === 403
        ? "Connect Spotify again to grant playlist access."
        : "Unable to load Spotify playlists.",
    });
  }
});

router.get("/spotify/playlists/:playlistId/export", requireAppLogin, async function (req, res) {
  const format = String(req.query.format || "").toLowerCase();
  if (format !== "json" && format !== "txt") {
    return res.status(400).json({ status: "NOK", error: "Format must be json or txt." });
  }

  try {
    const playlistId = encodeURIComponent(req.params.playlistId);
    const [playlistResponse, items] = await Promise.all([
      spotifyGet("https://api.spotify.com/v1/playlists/" + playlistId + "?fields=name"),
      getAllPages(
        "https://api.spotify.com/v1/playlists/" + playlistId +
        "/tracks?limit=100&fields=items(track(name,artists(name),album(name,release_date))),next"
      ),
    ]);

    const tracks = items
      .map((item) => item.track || item.item)
      .filter(Boolean)
      .map((track) => ({
        artist: (track.artists || []).map((artist) => artist.name).join(", "),
        track: track.name || "",
        album: track.album?.name || "",
        release_date: track.album?.release_date || "",
      }));

    const safeName = (playlistResponse.data.name || "playlist")
      .replace(/[\\/:*?"<>|]/g, "_")
      .trim() || "playlist";
    res.setHeader(
      "Content-Disposition",
      "attachment; filename*=UTF-8''" + encodeURIComponent(safeName + "." + format)
    );

    if (format === "json") {
      res.type("application/json").send(JSON.stringify(tracks, null, 2));
    } else {
      const text = tracks.map((track) =>
        [track.artist, track.track, track.album, track.release_date].join(" - ")
      ).join("\n");
      res.type("text/plain").send(text);
    }
  } catch (error) {
    const status = error.status || error.response?.status || 500;
    console.error("Error exporting Spotify playlist:", error.response?.data || error.message);
    res.status(status).json({ status: "NOK", error: "Unable to export this playlist." });
  }
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
    await backgroundLogger("Unable to authenticate with Spotify.", "error");
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
      await backgroundLogger("Successfully authenticated with Spotify.", "success");
      console.log("Tokens saved to database.");
      res.redirect("/");
    } catch (error) {
      console.log("Error on auth-callback:" + (error.response?.data || error.message));
      await backgroundLogger("Unable to authenticate with Spotify.", "error");
      res.redirect("/");
    }
  }
});

module.exports = router;

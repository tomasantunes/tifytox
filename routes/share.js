var express = require('express');
var router = express.Router();
var axios = require('axios');
var {getSpotifyToken} = require('../libs/spotify');

router.post("/share-track", async (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.json({ status: "NOK", message: "Invalid Authorization."});
  }
  var token = await getSpotifyToken();

  axios.get("https://api.spotify.com/v1/me/player", {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
  .then(function(response) {
    if (response.status === 401) {
      return res.json({ status: "NOK", error: "You are not logged in to Spotify." });
    }
    if (response.status !== 200) {
      return res.json({ status: "NOK", error: "Error fetching Spotify track." });
    }
    
    var item = response.data.item;
    var trackName = item.name;
    var trackArtists = item.artists.map(artist => artist.name).join(", ");
    var trackAlbum = item.album.name;
    var releaseDate = item.album.release_date;
    var message = `Currently playing track: ${trackName} by ${trackArtists} from the album ${trackAlbum}, released in ${releaseDate}.`;

    console.log(message);

    res.json({ status: "OK", message: "Track shared successfully." });
  })
  .catch(function(error) {
    console.error("Error fetching Spotify track:", error);
    res.json({ status: "NOK", error: "Error fetching Spotify track." });
  });
});

module.exports = router;
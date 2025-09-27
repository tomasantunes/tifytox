var axios = require("axios");
var secretConfig = require("../secret-config");

async function getSpotifyToken() {
  try {
    var access_token = null;
    var refresh_token = null;
    var sql = "SELECT * FROM tokens ORDER BY created_at DESC LIMIT 1;";

    const [rows, fields] = await con2.execute(sql);

    if (rows.length > 0) {
      access_token = rows[0].access_token;
      refresh_token = rows[0].refresh_token;
      return access_token;
    } else {
      return null;
    }
  } catch (error) {
    console.error(
      "Error fetching Spotify token:",
      error.response?.data || error.message
    );
    return null;
  }
}

const getRefreshToken = async (refreshToken) => {
  const url = "https://accounts.spotify.com/api/token";

  try {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
    });

    const response = await axios.post(url, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = response.data;
    let access_token = "";
    let refresh_token = "";

    if (!data.access_token) return false;
    if (!data.refresh_token) return false;

    access_token = data.access_token;
    refresh_token = data.refresh_token;

    await con2.execute(
      "UPDATE tokens SET access_token = ?, refresh_token = ? WHERE refresh_token = ?",
      [access_token, refresh_token, refreshToken]
    );

    return true;
    
  } catch (err) {
    console.error("Error refreshing token:", err.response?.data || err.message);
    return false;
  }
};

module.exports = {
    getSpotifyToken,
    getRefreshToken,
    default: {
        getSpotifyToken,
        getRefreshToken
    }
};
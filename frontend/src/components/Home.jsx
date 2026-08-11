import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import config from '../config.json';

export default function Home() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tempLogs, setTempLogs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(true);
  const [playlistError, setPlaylistError] = useState("");
  const [exporting, setExporting] = useState("");

  function loginSpotify() {
    window.location.href = config.BASE_URL + "/spotify/login";
  }

  function shareTrack() {
    axios.post(config.BASE_URL + "/share-track")
      .then(response => {
        if (response.data.status === "OK") {
          var message = encodeURI(response.data.data);
          window.open("https://twitter.com/intent/tweet?text=" + message, "_blank");
        }
        else {
          alert("Error: " + response.data.error);
        }
      })
      .catch(error => {
        console.error("Connection error:", error);
        alert("Connection error.");
      });
  }

  function checkTempLogs() {
    axios.post(config.BASE_URL + "/get-temp-logs")
      .then(response => {
        setTempLogs(response.data.data || []);
      })
      .catch(error => {
        console.error("Connection error:", error);
        alert("Connection error.");
      });
  }

  function loadPlaylists() {
    setIsLoadingPlaylists(true);
    setPlaylistError("");
    axios.get(config.BASE_URL + "/spotify/playlists")
      .then(response => setPlaylists(response.data.data || []))
      .catch(error => {
        setPlaylistError(error.response?.data?.error || "Unable to load Spotify playlists.");
      })
      .finally(() => setIsLoadingPlaylists(false));
  }

  function exportPlaylist(playlist, format) {
    const exportKey = playlist.id + ":" + format;
    setExporting(exportKey);
    axios.get(
      config.BASE_URL + "/spotify/playlists/" + encodeURIComponent(playlist.id) + "/export",
      { params: { format }, responseType: "blob" }
    )
      .then(response => {
        const url = URL.createObjectURL(response.data);
        const link = document.createElement("a");
        link.href = url;
        link.download = playlist.name + "." + format;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      })
      .catch(() => alert("Unable to export this playlist."))
      .finally(() => setExporting(""));
  }

  useEffect(() => {
    axios.post(config.BASE_URL + "/check-login")
      .then(response => {
        if (response.data.status === "OK") {
          setIsLoggedIn(true);
          checkTempLogs();
          loadPlaylists();
        }
        else {
          navigate('/login');
        }
      })
      .catch(error => {
        navigate('/login');
      });
  }, []);

  if (isLoggedIn) {
    return (
      <>
        <div className="container">
          <div className="home-header">
            <div>
              <h1>Your playlists</h1>
              <p className="text-secondary mb-0">Export artist, track, album, and release date.</p>
            </div>
            <button className="btn btn-outline-success" onClick={loginSpotify}>Connect Spotify</button>
          </div>
          {tempLogs.map((log, index) => {
            if (log.type == "success") {
              return <div key={index} className="alert alert-success" role="alert">
                {log.message}
              </div>
            }
            else if (log.type == "error") {
              return <div key={index} className="alert alert-danger" role="alert">
                {log.message}
              </div>
            }
          })}
          {isLoadingPlaylists && <div className="playlist-status">Loading playlists…</div>}
          {!isLoadingPlaylists && playlistError && (
            <div className="alert alert-warning d-flex justify-content-between align-items-center">
              <span>{playlistError}</span>
              <button className="btn btn-sm btn-success" onClick={loginSpotify}>Connect</button>
            </div>
          )}
          {!isLoadingPlaylists && !playlistError && playlists.length === 0 && (
            <div className="playlist-status">No playlists found.</div>
          )}
          <div className="playlist-list">
            {playlists.map(playlist => (
              <div className="playlist-row" key={playlist.id}>
                {playlist.image
                  ? <img src={playlist.image} alt="" className="playlist-cover" />
                  : <div className="playlist-cover playlist-cover-placeholder">♫</div>}
                <div className="playlist-details">
                  <h2>{playlist.name}</h2>
                  <span>{playlist.trackCount} {playlist.trackCount === 1 ? "track" : "tracks"}</span>
                </div>
                <div className="playlist-actions">
                  {["json", "txt"].map(format => {
                    const exportKey = playlist.id + ":" + format;
                    return <button
                      key={format}
                      className={format === "json" ? "btn btn-success" : "btn btn-outline-success"}
                      disabled={Boolean(exporting)}
                      onClick={() => exportPlaylist(playlist, format)}
                    >
                      {exporting === exportKey ? "Exporting…" : "Export " + format.toUpperCase()}
                    </button>
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="legacy-actions">
            <button className="btn btn-sm btn-link text-secondary" onClick={shareTrack}>Share current track</button>
          </div>
        </div>
      </>
    );
  } 
  else {
    return (<></>);
  }
}

import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import config from '../config.json';

export default function Home() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  function loginSpotify() {
    window.location.href = config.BASE_URL + "/spotify/login";
  }

  function shareTrack() {
    axios.post(config.BASE_URL + "/share-track")
      .then(response => {
        if (response.data.status === "OK") {
          var message = encodeURI(response.data.message);
          window.open("https://twitter.com/intent/tweet?text=" + message, "_blank");
        }
        else {
          alert("Error sharing track.");
        }
      })
      .catch(error => {
        console.error("Connection error:", error);
        alert("Connection error.");
      });
  }

  useEffect(() => {
    axios.post(config.BASE_URL + "/check-login")
      .then(response => {
        if (response.data.status === "OK") {
          setIsLoggedIn(true);
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
          <h1>Home</h1>
          <button className="btn btn-success" onClick={loginSpotify}>Login with Spotify</button>
          <button className="btn btn-success" onClick={shareTrack}>Share Track</button>
        </div>
      </>
    );
  } 
  else {
    return (<></>);
  }
}

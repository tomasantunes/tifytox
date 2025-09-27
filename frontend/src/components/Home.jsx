import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import config from '../config.json';

export default function Home() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tempErrors, setTempErrors] = useState([]);

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

  function checkTempErrors() {
    axios.post(config.BASE_URL + "/get-temp-errors")
      .then(response => {
        setTempErrors(response.data.errors || []);
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
          checkTempErrors();
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
          {tempErrors.map((error, index) => (
            <div key={index} className="alert alert-danger" role="alert">
              {error.message}
            </div>
          ))}
          <button className="btn btn-success me-2" onClick={loginSpotify}>Login with Spotify</button>
          <button className="btn btn-success" onClick={shareTrack}>Share Track</button>
        </div>
      </>
    );
  } 
  else {
    return (<></>);
  }
}

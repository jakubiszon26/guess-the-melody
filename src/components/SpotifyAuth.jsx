import axios from "axios";
import { useEffect, useState } from "react";
const SpotifyAuth = () => {
  const spotifyendpoint = "https://accounts.spotify.com/authorize";
  const redirecturi = "http://127.0.0.1:3000/";
  const clientid = "918689905d6d43f1970fd741950e8d3f";

  const scopes = [
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
  ];
  const loginurl = `${spotifyendpoint}?client_id=${clientid}&redirect_uri=${redirecturi}&scope=${scopes.join(
    "%20"
  )}&response_type=code&show_dialog=true`;

  const [token, setToken] = useState(null);
  const requestToken = (code) => {
    console.log("Authorization code:", code);
    axios
      .get("http://127.0.0.1:3001/getToken", { params: { code } })
      .then((response) => {
        setToken(response.data.access_token);
        console.log("Access Token:", response.data.access_token);
      });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      requestToken(code);
      window.history.pushState({}, "", "/");
    } else {
      return;
    }
  }, []);

  return (
    <div>
      <a href={loginurl}>Login to Spotify</a>
      <h1>{token ? token : "No token found"}</h1>
    </div>
  );
};

export default SpotifyAuth;

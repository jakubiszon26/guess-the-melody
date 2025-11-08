import axios from "axios";
import { useEffect } from "react";
const SpotifyAuth = (props) => {
  const spotifyendpoint = "https://accounts.spotify.com/authorize";
  const redirecturi = "http://127.0.0.1:3000/";
  const clientid = "918689905d6d43f1970fd741950e8d3f";
  const { setToken } = props;

  const scopes = [
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
  ];
  const loginurl = `${spotifyendpoint}?client_id=${clientid}&redirect_uri=${redirecturi}&scope=${scopes.join(
    "%20"
  )}&response_type=code&show_dialog=true`;

  useEffect(() => {
    const requestToken = (code) => {
      console.log("Authorization code:", code);
      axios
        .get("http://127.0.0.1:3001/getToken", {
          params: { code },
          withCredentials: true,
        })
        .then((response) => {
          console.log(response.data);
          if (response.data.login === "success") {
            setToken(true);
          }
        });
    };
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      requestToken(code);
      window.history.pushState({}, "", "/");
    } else {
      return;
    }
  }, [setToken]);

  return (
    <div>
      <a href={loginurl}>Login to Spotify</a>
    </div>
  );
};

export default SpotifyAuth;

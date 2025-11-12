import { useEffect } from "react";
import { exchangeCodeForToken } from "../api/spotifyApi";
const SpotifyAuth = (props) => {
  const spotifyendpoint = "https://accounts.spotify.com/authorize";
  const redirecturi = "http://127.0.0.1:3000/";
  const clientid = "918689905d6d43f1970fd741950e8d3f";

  const { setToken } = props;

  const scopes = [
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "streaming",
    "user-read-email",
    "user-read-private",
  ];
  const loginurl = `${spotifyendpoint}?client_id=${clientid}&redirect_uri=${redirecturi}&scope=${scopes.join(
    "%20"
  )}&response_type=code&show_dialog=true`;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      //token is either true or false, it indicates whether user is logged
      exchangeCodeForToken(code).then((token) => {
        setToken(token);
      });
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

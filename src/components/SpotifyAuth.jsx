import { useEffect } from "react";
import { exchangeCodeForToken } from "../api/spotifyApi";
import { Button } from "../components/ui/button";
import spotifyLogo from "../assets/icons/Spotify_logo.svg";
const SpotifyAuth = (props) => {
  const spotifyendpoint = "https://accounts.spotify.com/authorize";
  const redirecturi = "http://127.0.0.1:3000/";
  const clientid = "918689905d6d43f1970fd741950e8d3f";

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
      exchangeCodeForToken(code);
      window.history.pushState({}, "", "/");
    } else {
      return;
    }
  }, []);

  return (
    <div className="m-4">
      <a className="text-white" href={loginurl}>
        <Button>
          <img className="w-5" src={spotifyLogo} />
          Login with Spotify
        </Button>
      </a>
    </div>
  );
};

export default SpotifyAuth;

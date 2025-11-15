import { useEffect } from "react";
import { exchangeCodeForToken, getSpotifyLoginUrl } from "../api/spotifyApi";
import { Button } from "../components/ui/button";
import spotifyLogo from "../assets/icons/Spotify_logo.svg";
const SpotifyAuth = (props) => {
  const buttonClicked = () => {
    window.location.href = getSpotifyLoginUrl();
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      exchangeCodeForToken(code);
      window.history.pushState({}, "", "/");
    } else {
      return;
    }
  }, []);

  return (
    <div className="m-4">
      <Button onClick={() => buttonClicked()}>
        <img className="w-5" src={spotifyLogo} />
        Login with Spotify
      </Button>
    </div>
  );
};

export default SpotifyAuth;

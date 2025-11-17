import { useEffect } from "react";
import { exchangeCodeForToken, getSpotifyLoginUrl } from "../api/spotifyApi";
import { Button } from "../components/ui/button";
import spotifyLogo from "../assets/icons/Spotify_logo.svg";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
const SpotifyAuth = (props) => {
  const buttonClicked = () => {
    window.location.href = getSpotifyLoginUrl();
  };
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      exchangeCodeForToken(code)
        .then(async (success) => {
          if (!success) return;
          await queryClient.refetchQueries({ queryKey: ["authentication"] });
          window.history.replaceState(null, "", "/login");
          navigate("/", { replace: true });
        })
        .catch(console.error);
    }
  }, [queryClient, navigate]);

  return (
    <div className="m-4">
      <Button variant="outline" onClick={() => buttonClicked()}>
        <img className="w-5" src={spotifyLogo} />
        Login with Spotify
      </Button>
    </div>
  );
};

export default SpotifyAuth;

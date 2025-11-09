import "./App.css";
import SpotifyAuth from "./components/SpotifyAuth";
import { useEffect, useState } from "react";
import {
  fetchUserProfile,
  checkAuth,
  fetchPlayingTrack,
  getTrackInfo,
  findPrieviewUrl,
} from "./api/spotifyApi";
function App() {
  //only true/false for whether user is logged in. Authentication via cookie
  const [token, setToken] = useState(false);
  const [user, setUser] = useState(null);
  const [playingTrack, setPlayingTrack] = useState(null);
  useEffect(() => {
    if (token) {
      fetchUserProfile().then((data) => setUser(data));
      fetchPlayingTrack().then((data) => setPlayingTrack(data));
      console.log(findPrieviewUrl("Diet Pepsi", "Addison Rae"));
    } else if (!token) {
      checkAuth().then((isAuth) => setToken(isAuth));
    }
  }, [token]);

  return (
    <div className="App">
      {token ? (
        <div>
          <h1>Welcome! {user?.display_name || "User"} </h1>
          <h2>Currently Playing: {playingTrack?.item?.name || "Nothing"}</h2>
        </div>
      ) : (
        <SpotifyAuth setToken={setToken} />
      )}
    </div>
  );
}

export default App;

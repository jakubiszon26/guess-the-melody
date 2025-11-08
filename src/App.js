import "./App.css";
import SpotifyAuth from "./components/SpotifyAuth";
import { useEffect, useState } from "react";
import { fetchUserProfile, checkAuth } from "./api/spotifyApi";
function App() {
  //only true/false for whether user is logged in. Authentication via cookie
  const [token, setToken] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      fetchUserProfile(token).then((data) => setUser(data));
    } else if (!token) {
      checkAuth().then((isAuth) => setToken(isAuth));
    }
  }, [token]);

  return (
    <div className="App">
      {token ? (
        <h1>Welcome! {user ? user.display_name : "User"} </h1>
      ) : (
        <SpotifyAuth setToken={setToken} />
      )}
    </div>
  );
}

export default App;

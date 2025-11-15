import SpotifyAuth from "./components/SpotifyAuth";
import "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import {
  fetchUserProfile,
  checkAuth,
  fetchPlayingTrack,
} from "./api/spotifyApi";
function App() {
  const {
    data: isAuthenticated,
    error: authenticationError,
    isLoading: authenticationIsLoading,
  } = useQuery({
    queryKey: ["authentication"],
    queryFn: checkAuth,
  });
  const { data: userData } = useQuery({
    queryKey: ["userData"],
    queryFn: fetchUserProfile,
    enabled: !!isAuthenticated,
  });

  const { data: playingTrack } = useQuery({
    queryKey: ["playingTrack"],
    queryFn: fetchPlayingTrack,
    enabled: !!isAuthenticated,
    refetchInterval: (query) => {
      const data = query.state.data;

      if (!data || !data.is_playing) {
        return 15000;
      }

      const duration_ms = data.item.duration_ms;
      const progress_ms = data.progress_ms;
      const remaining_ms = duration_ms - progress_ms;

      const nextRefetch = remaining_ms + 2000;

      return Math.max(nextRefetch, 5000);
    },
  });

  if (authenticationIsLoading) {
    return <h1>loading...</h1>;
  }
  if (authenticationError) {
    return <h1>Authentication error.</h1>;
  }
  return (
    <div className="App">
      {isAuthenticated ? (
        <div>
          <h1>Welcome! {userData?.display_name || "User"} </h1>
          <h2>Currently Playing: {playingTrack?.item?.name || "Nothing"}</h2>
        </div>
      ) : (
        <SpotifyAuth />
      )}
    </div>
  );
}

export default App;

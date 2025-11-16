import "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import {
  fetchUserProfile,
  checkAuth,
  fetchPlayingTrack,
  fetchPlaylists,
} from "./api/spotifyApi";
import { ThemeProvider } from "../src/components/ThemeProvider";
import LoginView from "./pages/LoginView";
import GameDashboard from "./pages/GameDashboard";
import { AppSidebar } from "./components/AppSidebar";
import { SidebarProvider } from "./components/ui/sidebar";
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

  const {
    data: userPlaylists,
    error: playlistsError,
    isLoading: playlistsLoading,
  } = useQuery({
    queryKey: ["playlists"],
    queryFn: fetchPlaylists,
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
    <ThemeProvider>
      <SidebarProvider>
        <AppSidebar
          userData={userData}
          playingTrack={playingTrack}
          userPlaylists={userPlaylists}
        />
        <main>{isAuthenticated ? <GameDashboard /> : <LoginView />}</main>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;

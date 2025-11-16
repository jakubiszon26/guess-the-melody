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
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar";
import { useState } from "react";
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

  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playerCount, setPlayerCount] = useState(1);
  const [gameLength, setGameLength] = useState("short");

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
          setSelectedPlaylist={setSelectedPlaylist}
        />
        <SidebarInset>
          <div className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background/80 p-4 backdrop-blur md:hidden">
            <SidebarTrigger className="md:hidden" />
            <span className="text-sm font-semibold">Open navigation</span>
          </div>
          <main className="flex-1 p-4">
            {isAuthenticated ? (
              <GameDashboard
                selectedPlaylist={selectedPlaylist}
                playerCount={playerCount}
                setPlayerCount={setPlayerCount}
                gameLength={gameLength}
                setGameLength={setGameLength}
              />
            ) : (
              <LoginView />
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;

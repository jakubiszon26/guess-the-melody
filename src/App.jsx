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
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useState } from "react";
import GameLobby from "./pages/GameLobby";
import { getSession } from "./api/gameApi";
import JoinGamePage from "./pages/JoinGamePage";
import HostGameScreen from "./pages/HostGameScreen";
import PlayerGameScreen from "./pages/PlayerGameScreen";

const ProtectedRoute = ({ isAllowed, redirectTo = "/login", children }) => {
  if (!isAllowed) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
};

const ProtectedLayout = ({
  userData,
  playingTrack,
  userPlaylists,
  setSelectedPlaylist,
  gameSettings,
}) => {
  return (
    <SidebarProvider>
      <AppSidebar
        userData={userData}
        playingTrack={playingTrack}
        userPlaylists={userPlaylists}
        setSelectedPlaylist={setSelectedPlaylist}
        gameSettings={gameSettings}
      />
      <SidebarInset>
        <div className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background/80 p-4 backdrop-blur md:hidden">
          <SidebarTrigger className="md:hidden" />
          <span className="text-sm font-semibold">Open navigation</span>
        </div>
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};
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
  const { data: gameSession, isLoading: gameSessionLoading } = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    enabled: !!isAuthenticated,
  });

  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playerCount, setPlayerCount] = useState(1);
  const [gameLength, setGameLength] = useState("short");
  //move to local storage later
  const [isHost, setIsHost] = useState(false);
  const [isPlayer, setIsPlayer] = useState(false);
  const gameSettings = {
    selectedPlaylist: selectedPlaylist,
    playerCount: playerCount,
    gameLength: gameLength,
  };

  if (authenticationIsLoading) {
    return <h1>loading...</h1>;
  }
  if (authenticationError) {
    return <h1>Authentication error.</h1>;
  }

  return (
    <ThemeProvider>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginView />
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute isAllowed={isAuthenticated} redirectTo="/login">
              <ProtectedLayout
                userData={userData}
                playingTrack={playingTrack}
                userPlaylists={userPlaylists}
                setSelectedPlaylist={setSelectedPlaylist}
                gameSettings={gameSettings}
              />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <GameDashboard
                selectedPlaylist={selectedPlaylist}
                playerCount={playerCount}
                setPlayerCount={setPlayerCount}
                gameLength={gameLength}
                setGameLength={setGameLength}
                gameSettings={gameSettings}
                gameSession={gameSession}
                gameSessionLoading={gameSessionLoading}
              />
            }
          />
        </Route>

        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
        />
        <Route
          path="/lobby"
          element={
            <ProtectedRoute
              isAllowed={
                isAuthenticated &&
                (gameSessionLoading || Boolean(gameSession?.gameSession))
              }
              redirectTo="/login"
            >
              <GameLobby
                setIsHost={setIsHost}
                isHost={isHost}
                session={gameSession?.gameSession}
              />
            </ProtectedRoute>
          }
        ></Route>
        <Route
          path="/join"
          element={
            <JoinGamePage isPlayer={isPlayer} setIsPlayer={setIsPlayer} />
          }
        ></Route>
        <Route
          path="/gamescreen"
          element={
            <ProtectedRoute isAllowed={isHost} redirectTo="/">
              <HostGameScreen gameSession={gameSession} />{" "}
            </ProtectedRoute>
          }
        ></Route>
        <Route
          path="/playerscreen"
          element={
            <ProtectedRoute isAllowed={isPlayer} redirectTo="/join">
              <PlayerGameScreen />
            </ProtectedRoute>
          }
        ></Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;

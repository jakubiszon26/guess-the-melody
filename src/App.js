import logo from "./logo.svg";
import "./App.css";
import SpotifyAuth from "./components/SpotifyAuth";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";

function App() {
  return (
    <div className="App">
      <SpotifyAuth />
    </div>
  );
}

export default App;

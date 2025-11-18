# Frontend Documentation

## Overview

The frontend is a Vite-powered React application that uses React Router for navigation, React Query for data orchestration, Socket.io for live lobby sync, and Shadcn UI primitives for consistent styling. Authentication, Spotify data, and game lifecycle state all flow through axios helpers located in `src/api`, each configured with `withCredentials: true` so the `session_token` cookie automatically accompanies every request.

## Application Layout & Routing

- `App.jsx` bootstraps global queries (`checkAuth`, `fetchUserProfile`, `fetchPlaylists`, `fetchPlayingTrack`, `getSession`) and gates authenticated routes with `ProtectedRoute`.
- `ProtectedLayout` renders `AppSidebar` plus an `<Outlet>` so nested pages share the sidebar shell.
- **Route summary:**
  | Path | Element | Notes |
  | --- | --- | --- |
  | `/login` | `<LoginView />` | Public. Redirects to `/` if already authenticated. |
  | `/` (index) | `<GameDashboard />` | Requires auth. Hosts playlist selection + lobby creation. |
  | `/lobby` | `<GameLobby />` | Protected by auth **and** `gameSession`. Displays join code + roster. |
  | `/join` | `<JoinGamePage />` | Public guest entry; validates code/name before joining via Socket.io. |
  | `*` | `<Navigate .../>` | Redirects back to `/login` or `/` depending on auth state. |

Route guards rely on the React Query result of `checkAuth`. Until that promise resolves `true`, all downstream queries are disabled via the `enabled` option so no protected call fires prematurely.

## Authentication Flow (Frontend Perspective)

1. **Launch Login:** `LoginView` shows the `SpotifyAuth` button, which calls `getSpotifyLoginUrl()` and replaces `window.location.href` to start the OAuth flow.
2. **Handle Callback:** When Spotify redirects back with a `code`, `SpotifyAuth` detects it via `URLSearchParams`, calls `exchangeCodeForToken(code)`, and waits for `{ login: "success" }`.
3. **Revalidate State:** On success the component refetches the `authentication` React Query, clears the `?code=...` from the URL, and navigates to `/`. Downstream queries (`userData`, `playlists`, `playingTrack`, `session`) automatically re-run because their `enabled` flag becomes truthy.
4. **Session Usage:** Every other axios helper includes `withCredentials: true`, so the `session_token` httpOnly cookie is implicitly attached. No explicit logout exists yet; clearing the cookie forces `checkAuth` to return `false` and navigates the user back to `/login`.

## Data Fetching & Local State

- **React Query keys:**
  - `['authentication']` → `checkAuth`
  - `['userData']` → `fetchUserProfile`
  - `['playlists']` → `fetchPlaylists`
  - `['playingTrack']` → `fetchPlayingTrack` (custom refetch interval based on remaining track duration)
  - `['session']` → `getSession`
  - `['gamecode']` → `getGameCode`
- **Local state in `GameDashboard`:** `selectedPlaylist`, `playerCount`, `gameLength`. These shape the `gameSettings` object sent to `/game/request-new-game`.
- **Cache invalidation:** After `requestNewGame` resolves, the dashboard invalidates `['session']` so `/lobby` reflects the latest Redis snapshot.

## Spotify & Game API Clients

### `src/api/spotifyApi.js`

| Function                                            | Purpose                                                                                                 | Notes                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `getSpotifyLoginUrl()`                              | Returns `http://127.0.0.1:3001/users/get-spotify-login-url` for the login button.                       | No args.                                 |
| `exchangeCodeForToken(code)`                        | Hits `/users/getToken?code=...`, waits for `{ login: "success" }`, and resolves `true`/`false`.         | Triggers backend to set `session_token`. |
| `checkAuth()`                                       | Calls `/users/checkAuth`; drives `ProtectedRoute`.                                                      | Returns `boolean`.                       |
| `fetchUserProfile()`                                | Proxies `/users/fetch-user-profile` for avatar + sidebar info.                                          | Returns Spotify profile or `null`.       |
| `fetchPlaylists()`                                  | Retrieves playlists for sidebar selection.                                                              | Depends on auth.                         |
| `fetchPlayingTrack()`                               | Calls `/music/currently-playing`; refetch interval calibrated to remaining track duration.              | Returns playback payload or `null`.      |
| `getTracksFromPlaylist(playlist)`                   | Loads playlist tracks to validate game length options.                                                  | Requires `playlist.id`.                  |
| `getTrackInfo`, `getAccessToken`, `findPrieviewUrl` | Referenced for future enhancements; backend routes do not exist yet, so callers should expect failures. |

### `src/api/gameApi.js`

| Function                       | Purpose                                                                                                                                 |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `requestNewGame(gameSettings)` | Posts `{ gameSettings }` to `/game/request-new-game`. Expects `{ created, gameID, gameCode }` and triggers host navigation to `/lobby`. |
| `getSession()`                 | Fetches `/game/session` to decide whether to show the “Return to the game” prompt on the dashboard.                                     |
| `getGameCode()`                | Retrieves `/game/get-game-code` for rendering inside `GameLobby`. Throws if no active session exists.                                   |

### `src/api/socket.js`

Exports a singleton Socket.io client:

```js
export const socket = io("http://127.0.0.1:3001", {
  autoConnect: false,
  withCredentials: true,
});
```

Pages call `socket.connect()` immediately before emitting events so connections are only established when necessary.

## Game Lifecycle (UI + WebSocket Coordination)

1. **Playlist Preparation:** `AppSidebar` lets hosts pick a playlist. `GameDashboard` fetches its tracks, enforces minimum counts per `gameLength`, and exposes sliders/buttons to configure `playerCount` + `gameLength`.
2. **Lobby Creation:** Clicking **Start Game** calls `requestNewGame(gameSettings)`. On success the app invalidates `['session']` and routes to `/lobby`.
3. **Host Lobby View (`GameLobby`):**
   - React Query fetches `gameCode`.
   - On mount: `socket.connect()`, emit `join_game(gameCode, 'Host')`.
   - Listen for `update_players` to keep the roster synchronized and for `game_started` to toggle UI.
   - Emit `host_start_game(gameCode)` when the host clicks the Start button.
4. **Guest Join Flow (`JoinGamePage`):**
   - `react-hook-form` + `zod` validate a six-digit code and nickname (must not equal “Host”).
   - On submit: ensure socket is connected, emit `join_game(code, username, callback)`.
   - Display server-side validation errors via `form.setError` when the callback signals `{ success: false }`.
   - Once joined, listen for `game_started` to know when to transition away from the waiting message.
5. **Real-time Updates:** The backend emits `update_players` and `game_started` based on lobby events. Both `GameLobby` and `JoinGamePage` subscribe to these events and clean up listeners on unmount to avoid leaks.

## UI Building Blocks

- **Shadcn components:** `Card`, `Button`, `Badge`, `Slider`, `ScrollArea`, `Form`, etc., provide consistent styling across dashboards and forms.
- **Sidebar system:** `SidebarProvider`, `SidebarTrigger`, and `AppSidebar` wrap the main layout, showing playlists, active track info, and quick actions.
- **Form helpers:** `FormField`, `FormItem`, and `FormMessage` centralize validation feedback.

## Key Frontend Functions & Components

| Item             | Location                         | Description                                                                                                                                                  |
| ---------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SpotifyAuth`    | `src/components/SpotifyAuth.jsx` | Detects `code` params, exchanges them for cookies, and navigates to `/`.                                                                                     |
| `ProtectedRoute` | `src/App.jsx`                    | Redirects unauthenticated users to `/login`.                                                                                                                 |
| `GameDashboard`  | `src/pages/GameDashboard.jsx`    | Fetches playlist tracks, handles slider/button inputs, calls `requestNewGame`, and prevents duplicate lobbies by short-circuiting when `gameSession` exists. |
| `GameLobby`      | `src/pages/GameLobby.jsx`        | Displays join code, renders live player list, and emits `host_start_game`.                                                                                   |
| `JoinGamePage`   | `src/pages/JoinGamePage.jsx`     | Guest entry form with inline validation and socket coordination.                                                                                             |

## Testing & Troubleshooting Tips

- Use browser dev tools to clear the `session_token` cookie while developing logout flows; React Query will automatically re-run `checkAuth` and redirect to `/login`.
- When sockets misbehave, confirm that both host and guest tabs call `socket.connect()` **before** emitting events. The client is initialized with `autoConnect: false`, so forgetting this step results in silent no-ops.
- For playlist/game creation bugs, inspect the network tab for `/game/request-new-game` responses and ensure the `gameSettings` payload includes `gameLenght`, `gamePlayers`, and `tracks` as expected by the backend `GameState` constructor.

## Future Enhancements

- Add a logout button that clears the cookie and invalidates related queries.
- Implement the missing backend routes (`/music/get-track-info`, `/music/find-preview-url`, `/users/getAccessToken`) or remove the corresponding API helper stubs until they exist.
- Persist `gameStarted` status back into Redis inside the socket handler so reconnecting clients can detect in-progress games without relying solely on real-time events.

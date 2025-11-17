# Frontend Documentation

## Overview

The frontend is a React application bootstrapped with Vite and styled via custom components. Data fetching relies on `@tanstack/react-query` so that authentication status, Spotify profile data, playlists, playback state, and game sessions all share a consistent caching strategy. Routing is powered by `react-router-dom` and guarded with custom wrappers to ensure only authenticated players can reach gameplay surfaces.

## Authentication Flow

The login journey orchestrates Spotify OAuth, backend callbacks, and React Query cache invalidation.

1. **Start Login:**
   - The `LoginView` component links to `getSpotifyLoginUrl()` from `src/api/spotifyApi.js`, which returns `http://127.0.0.1:3001/users/get-spotify-login-url`.
   - Clicking the CTA navigates the browser to the Spotify consent page with the required scopes.
2. **Spotify Consent:**
   - After the player grants access, Spotify redirects to the backend’s `/users/getToken` endpoint with a `code` query string.
3. **Token Exchange & Session Cookie:**
   - The backend swaps the `code` for Spotify access/refresh tokens, stores them, signs a JWT, and returns `{ login: "success" }` while setting the `session_token` httpOnly cookie.
4. **React Query Revalidation:**
   - The frontend calls `checkAuth()` via React Query’s `useQuery({ queryKey: ["authentication"], queryFn: checkAuth })`. When the cookie is present, the hook resolves to `true` and gatekeeping components re-render.
5. **Authenticated Data Fetches:**
   - Follow-up queries (profile, playlists, currently playing track, active lobby via `getSession`) use the same `withCredentials` axios configuration so the cookie travels with every request.
6. **Logout Handling:**
   - No explicit logout endpoint exists yet. Clearing the cookie (e.g., via browser dev tools) or letting it expire flips `checkAuth` back to `false`, sending the player to `/login`.

## Routing Flow

Routing is centralized in `src/App.jsx`. Authentication state flows into guard components that wrap the layout tree.

### Core Components

- **`ProtectedRoute`**

  - Props: `isAllowed`, `redirectTo`, `children`.
  - Behavior: If `isAllowed` is falsy, it returns `<Navigate to={redirectTo} replace />`; otherwise, it renders its children.
  - Usage: Wraps the `/` route tree and the `/lobby` page.

- **`ProtectedLayout`**
  - Props: `userData`, `playingTrack`, `userPlaylists`, `setSelectedPlaylist`, `gameSettings`.
  - Behavior: Renders the `SidebarProvider`, `AppSidebar`, and an `<Outlet>` container for nested routes. Mobile-friendly header toggles the sidebar.
  - Usage: Root element of the authenticated portion of the app so nested pages inherit the sidebar + layout chrome.

### Route Map

| Path        | Element                                                     | Notes                                                                       |
| ----------- | ----------------------------------------------------------- | --------------------------------------------------------------------------- |
| `/login`    | `<LoginView />` or redirect to `/` if already authenticated | Public route.                                                               |
| `/`         | `<ProtectedRoute><ProtectedLayout /></ProtectedRoute>`      | Houses the dashboard and any future authenticated child routes.             |
| `/` (index) | `<GameDashboard />`                                         | Nested child rendered via `<Outlet>`. Receives playlist/game state setters. |
| `/lobby`    | `<ProtectedRoute><GameLobby /></ProtectedRoute>`            | Requires both authentication and a cached `gameSession` (or still loading). |
| `*`         | `<Navigate to={isAuthenticated ? "/" : "/login"} />`        | Catch-all guard aligning unknown paths with auth status.                    |

### Data Fetch Integration

- Authentication gate (`checkAuth`) runs first. Its `isAuthenticated` result gates all other queries via the `enabled` flag.
- `fetchUserProfile`, `fetchPlaylists`, `fetchPlayingTrack`, and `getSession` all depend on the auth query succeeding and re-run automatically when the cookie status changes.
- `GameDashboard` uses local state (`selectedPlaylist`, `playerCount`, `gameLength`) to compose `gameSettings`, which the `Start Game` CTA posts to the backend.

## API Client Reference

All API helpers live under `src/api`. They centralize axios usage with `withCredentials: true` so cookies accompany every call.

### `src/api/gameApi.js`

| Function                       | Description                                                                                                                             | Parameters                                                                      | Returns                                                         |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `requestNewGame(gameSettings)` | Posts to `POST /game/request-new-game` to persist a lobby in Redis. Logs the response and returns `{ created, gameID }`.                | `gameSettings` (object) – includes playlist metadata, player count, and length. | Resolves with the backend JSON response or throws on failure.   |
| `getSession()`                 | Calls `GET /game/session` to recover the active lobby for the authenticated user. Useful for deciding if `/lobby` should be accessible. | None.                                                                           | Resolves with `{ gameSession }` or `null` if no session exists. |

### `src/api/spotifyApi.js`

| Function                              | Description                                                                                                                                    | Parameters                           | Returns                                              |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------- |
| `getSpotifyLoginUrl()`                | Returns the backend URL that initiates the Spotify OAuth redirect.                                                                             | None.                                | `string` login URL.                                  |
| `exchangeCodeForToken(code)`          | Calls `GET /users/getToken` with the provided authorization code. On success, the backend sets the session cookie.                             | `code` (string).                     | `boolean` indicating whether `{ login: "success" }`. |
| `fetchUserProfile()`                  | Retrieves the current user profile via `GET /users/fetch-user-profile`.                                                                        | None.                                | Spotify profile object or `null` on error.           |
| `checkAuth()`                         | Verifies the session cookie via `GET /users/checkAuth`.                                                                                        | None.                                | `true` when authenticated, otherwise `false`.        |
| `fetchPlayingTrack()`                 | Calls `GET /music/currently-playing` for playback state, using the dynamic refetch interval defined in `App.jsx`.                              | None.                                | Spotify playback payload or `null`.                  |
| `getTrackInfo(trackId)`               | Calls the (yet-to-be-implemented) backend route `/music/get-track-info` with `id` query param. Placeholder for future detailed track views.    | `trackId` (string).                  | Track metadata or `null`.                            |
| `getAccessToken()`                    | Requests `/users/getAccessToken` (not yet implemented) to expose the stored Spotify token. Useful for debugging but currently expected to 404. | None.                                | Intended to return token info.                       |
| `fetchPlaylists()`                    | Calls `GET /music/get-user-playlists` to populate the sidebar.                                                                                 | None.                                | Spotify playlists response or `null`.                |
| `getTracksFromPlaylist(playlistData)` | Fetches tracks for the selected playlist via `GET /music/get-tracks-from-playlist` with `playlistID`.                                          | `playlistData` (object with `id`).   | Playlist tracks payload or `null`.                   |
| `findPrieviewUrl(track, artist)`      | Queries `/music/find-preview-url` (not yet implemented) to look up preview snippets. Currently serves as a stub for future enhancements.       | `track` (string), `artist` (string). | `{ previewUrl }` or `null`.                          |

## Component Interaction Notes

- `AppSidebar` consumes `userPlaylists`, `setSelectedPlaylist`, and `gameSettings`, enabling users to pick the playlist before launching a game.
- `GameDashboard` pulls tracks from the selected playlist, enforces minimum track counts for each game length, and calls `requestNewGame`. After the Promise resolves with `{ created: true }`, it navigates to `/lobby` using `useNavigate`.
- `GameLobby` takes `session={gameSession?.gameSession}` and is only reachable when `getSession` succeeds or is still loading (prevents routing flicker while awaiting Redis).

## Extensibility Considerations

- Implementing logout can be achieved by adding a backend route that clears the `session_token` cookie and invalidates the JWT.
- `getTrackInfo`, `getAccessToken`, and `findPrieviewUrl` require matching Fastify routes; until they exist, callers should handle rejected Promises.
- Socket.io hooks in `GameSocketService` can dispatch events to the lobby once the frontend adds a socket client.

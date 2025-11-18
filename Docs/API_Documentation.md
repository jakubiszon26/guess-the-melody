# API Documentation

## Users Service

### GET /users/get-spotify-login-url

- **Endpoint:** `GET /users/get-spotify-login-url`
- **Description:** Builds the Spotify OAuth authorization URL with the required scopes and redirects the browser there so the user can grant access.
- **Authentication:** Not required.
- **Parameters:**
  | Name | Type | Location | Description |
  | --- | --- | --- | --- |
  | — | — | — | No parameters. |
- **Success Response:**
  ```json
  {
    "status": 302,
    "location": "https://accounts.spotify.com/authorize?client_id=...&scope=user-read-email%20streaming"
  }
  ```
- **Error Response:**
  ```json
  { "error": "Unable to generate login URL" }
  ```

### GET /users/getToken

- **Endpoint:** `GET /users/getToken`
- **Description:** Spotify callback handler. Exchanges the `code` query string for tokens, upserts the MongoDB user, signs a JWT session, and sets it as the `session_token` cookie.
- **Authentication:** Not required (called by Spotify after consent).
- **Parameters:**
  | Name | Type | Location | Description |
  | --- | --- | --- | --- |
  | code | string | query | Authorization code returned by Spotify. |
- **Success Response:**
  ```json
  { "login": "success" }
  ```
- **Error Response:**
  ```json
  { "error": "No code provided" }
  ```

### GET /users/checkAuth

- **Endpoint:** `GET /users/checkAuth`
- **Description:** Verifies the `session_token` cookie via Fastify's `authenticate` hook and returns whether the session is valid.
- **Authentication:** Required (JWT cookie).
- **Parameters:**
  | Name | Type | Location | Description |
  | --- | --- | --- | --- |
  | — | — | — | No parameters. |
- **Success Response:**
  ```json
  { "authenticated": true }
  ```
- **Error Response:**
  ```json
  { "error": "Unauthorized" }
  ```

### GET /users/fetch-user-profile

- **Endpoint:** `GET /users/fetch-user-profile`
- **Description:** Looks up a fresh Spotify access token for the logged-in user, proxies `GET https://api.spotify.com/v1/me`, and returns the Spotify profile payload.
- **Authentication:** Required (JWT cookie feeds `request.user.spotifyID`).
- **Parameters:**
  | Name | Type | Location | Description |
  | --- | --- | --- | --- |
  | — | — | — | No parameters. |
- **Success Response:**
  ```json
  {
    "display_name": "Player One",
    "email": "player@example.com",
    "id": "spotify_user_id",
    "images": [{ "url": "https://.../avatar.jpg" }]
  }
  ```
- **Error Response:**
  ```json
  { "error": "Failed to fetch profile" }
  ```

## Music Service

### GET /music/currently-playing

- **Endpoint:** `GET /music/currently-playing`
- **Description:** Uses the stored Spotify access token to proxy `GET /v1/me/player/currently-playing`. Returns `{ "is_playing": false }` when Spotify replies with HTTP 204.
- **Authentication:** Required.
- **Parameters:**
  | Name | Type | Location | Description |
  | --- | --- | --- | --- |
  | — | — | — | No parameters. |
- **Success Response:**
  ```json
  {
    "is_playing": true,
    "progress_ms": 61000,
    "item": {
      "name": "Song Title",
      "duration_ms": 185000,
      "artists": [{ "name": "Artist" }]
    }
  }
  ```
- **Error Response:**
  ```json
  { "error": "Failed to fetch currently playing track" }
  ```

### GET /music/get-user-playlists

- **Endpoint:** `GET /music/get-user-playlists`
- **Description:** Returns the Spotify playlists owned or followed by the authenticated user by proxying `GET /v1/me/playlists`.
- **Authentication:** Required.
- **Parameters:**
  | Name | Type | Location | Description |
  | --- | --- | --- | --- |
  | — | — | — | No parameters. |
- **Success Response:**
  ```json
  {
    "items": [
      {
        "id": "playlist_id",
        "name": "Gym Mix",
        "images": [{ "url": "https://.../cover.jpg" }]
      }
    ]
  }
  ```
- **Error Response:**
  ```json
  { "error": "couldnt get user playlists" }
  ```

### GET /music/get-several-tracks

- **Endpoint:** `GET /music/get-several-tracks`
- **Description:** Accepts a comma-delimited list of track IDs and proxies `GET /v1/tracks`.
- **Authentication:** Required.
- **Parameters:**
  | Name | Type | Location | Description |
  | --- | --- | --- | --- |
  | ids | string | query | Comma-separated Spotify track IDs (max 50 per request). |
- **Success Response:**
  ```json
  {
    "tracks": [{ "id": "trackId", "name": "Track", "preview_url": "..." }]
  }
  ```
- **Error Response:**
  ```json
  { "error": "ERROR IN /get-several-tracks" }
  ```

### GET /music/get-tracks-from-playlist

- **Endpoint:** `GET /music/get-tracks-from-playlist`
- **Description:** Fetches the tracks inside a playlist via `GET /v1/playlists/{playlistID}/tracks`.
- **Authentication:** Required.
- **Parameters:**
  | Name | Type | Location | Description |
  | --- | --- | --- | --- |
  | playlistID | string | query | Spotify playlist identifier whose tracks should be returned. |
- **Success Response:**
  ```json
  {
    "items": [
      {
        "track": {
          "id": "trackId",
          "name": "Track Name",
          "album": { "images": [{ "url": "https://.../art.jpg" }] }
        }
      }
    ]
  }
  ```
- **Error Response:**
  ```json
  { "error": "ERROR IN /get-several-tracks" }
  ```

### GET /music/get-ids-from-playlist

- **Endpoint:** `GET /music/get-ids-from-playlist`
- **Description:** Returns only the track IDs for a playlist so the frontend can perform follow-up bulk lookups.
- **Authentication:** Required.
- **Parameters:**
  | Name | Type | Location | Description |
  | --- | --- | --- | --- |
  | playlistID | string | query | Spotify playlist identifier. |
- **Success Response:**
  ```json
  ["1abc", "2def", "3ghi"]
  ```
- **Error Response:**
  ```json
  { "error": "ERROR IN /get-ids-from-playlist" }
  ```

### GET /music/convert-spotify-to-isrcs

- **Endpoint:** `GET /music/convert-spotify-to-isrcs`
- **Description:** Breaks a large comma-separated list of Spotify track IDs into 50-ID batches, fetches their metadata, and returns Spotify ID ↔ ISRC mappings (plus basic track info).
- **Authentication:** Required.
- **Parameters:**
  | Name | Type | Location | Description |
  | --- | --- | --- | --- |
  | ids | string | query | Comma-separated Spotify track IDs. |
- **Success Response:**
  ```json
  [
    {
      "spotifyID": "4uLU6hMCjMI75M1A2tKUQC",
      "isrc": "USSM19913504",
      "title": "Never Gonna Give You Up",
      "artist": "Rick Astley"
    }
  ]
  ```
- **Error Response:**
  ```json
  { "error": "Błąd w convertTrackID" }
  ```

### POST /music/get-preview-from-deezer

- **Endpoint:** `POST /music/get-preview-from-deezer`
- **Description:** Uses Deezer's search API as a fallback for 30-second previews. Accepts a pre-collected array of track metadata (with optional ISRCs) and an index to resolve.
- **Authentication:** Required.
- **Parameters:**
  | Name | Type | Location | Description |
  | --- | --- | --- | --- |
  | tracksArray | array | body | Array of track objects containing at least `title`, `artist`, or `isrc`. |
  | index | number | body | Position inside `tracksArray` to resolve.
- **Success Response:**
  ```json
  { "previewUrl": "https://cdns-preview-a.dzcdn.net/stream/c-audio.mp3" }
  ```
- **Error Response:**
  ```json
  { "error": "index missing or type error" }
  ```

## Game Service

### POST /game/request-new-game

- **Endpoint:** `POST /game/request-new-game`
- **Description:** Instantiates a `GameState`, assigns a random six-digit code, stores it in Redis for two hours under both `game:{hostSpotifyID}` and the numeric code, and returns the identifiers to the caller.
- **Authentication:** Required.
- **Parameters:**
  | Name | Type | Location | Description |
  | --- | --- | --- | --- |
  | gameSettings | object | body | Expected to include `gameLenght`, `gamePlayers`, and `tracks`. These fields populate `GameState`. |
- **Success Response:**
  ```json
  {
    "created": true,
    "gameID": "game:spotify_user",
    "gameCode": 123456
  }
  ```
- **Error Response:**
  ```json
  { "error": "Failed to create game" }
  ```

### GET /game/session

- **Endpoint:** `GET /game/session`
- **Description:** Loads the host's `GameState` from Redis (`game:{spotifyID}`) and returns it so the UI knows whether a lobby already exists.
- **Authentication:** Required.
- **Parameters:**
  | Name | Type | Location | Description |
  | --- | --- | --- | --- |
  | — | — | — | No parameters. |
- **Success Response:**
  ```json
  {
    "gameSession": {
      "gameID": "game:spotify_user",
      "hostSpotifyID": "spotify_user",
      "gameLenght": "short",
      "players": {},
      "gameCode": 123456,
      "gameStarted": false
    }
  }
  ```
- **Error Response:**
  ```json
  { "error": "Failed to load session" }
  ```

### GET /game/get-game-code

- **Endpoint:** `GET /game/get-game-code`
- **Description:** Convenience endpoint that extracts only the `gameCode` from the host's `GameState` so the lobby UI can render it.
- **Authentication:** Required.
- **Parameters:**
  | Name | Type | Location | Description |
  | --- | --- | --- | --- |
  | — | — | — | No parameters. |
- **Success Response:**
  ```json
  { "code": 123456 }
  ```
- **Error Response:**
  ```json
  { "error": "Failed to load session" }
  ```

## Realtime Socket Events

### Client ➜ Server: `join_game`

- **Payload:** `(code: number|string, name: string, callback?: function)`.
- **Behavior:**
  1. Resolves `code` to a Redis `gameID`. When not found, invokes the optional callback with `{ success: false, error: "No game with provided ID" }`.
  2. Rehydrates the stored `GameState` into a class instance. If `name === "Host"`, stores the emitting socket as `hostID`, joins the socket to the game room, and immediately emits the latest `update_players` list.
  3. Otherwise, adds the socket as a player (auto-generates `Player XXXX` when no name is provided), persists the updated state, joins the room, and calls the callback with `{ success: true, name }`.
  4. Emits `update_players` (see below) so all connected clients stay in sync.

### Client ➜ Server: `host_start_game`

- **Payload:** `(code: number|string, callback?: function)`.
- **Behavior:** Looks up the stored `GameState`, toggles `gameStarted = true` via `gameState.startGame()`, and emits `game_started` to the entire room. The handler currently does not persist the updated `GameState` back to Redis, so only connected sockets know that the game started.

### Server ➜ Client: `update_players`

- **Payload:** `Array<{ id: string, name: string }>` representing the lobby roster keyed by socket IDs.
- **Emitted When:** Host joins (`"Host"`), a guest joins, or after Redis persistence completes in `join_game`.

### Server ➜ Client: `game_started`

- **Payload:** `boolean` mirroring `gameState.gameStarted`.
- **Consumers:** `GameLobby` (sets local `gameStarted` state) and `JoinGamePage` (switches the guest view to the started state).

### Server ➜ Client: `error`

- **Payload:** `{ message: string }` emitted when an exception occurs inside socket handlers.

### Socket Lifecycle Flow

1. The host opens `/lobby`, which calls `getGameCode`, connects the socket, emits `join_game(code, "Host")`, and starts listening for `update_players` + `game_started`.
2. Guests visit `/join`, submit the code + nickname, and emit `join_game`. Validation errors arrive via the callback and are surfaced through `react-hook-form` errors.
3. When the host clicks **Start game**, the UI emits `host_start_game`. Every client listening for `game_started` flips into their gameplay-ready state.

### Unimplemented Client Calls

The frontend currently references the following endpoints, but no Fastify routes exist yet. Calls will fail until matching backend routes are added.

- `GET /music/get-track-info` – expected to proxy Spotify track metadata.
- `GET /music/find-preview-url` – expected to orchestrate preview lookups.
- `GET /users/getAccessToken` – would expose the stored Spotify token for debugging.

# Authentication Flow

1. **Login Kickoff (Frontend):** `LoginView` renders `SpotifyAuth`, whose "Login with Spotify" button calls `getSpotifyLoginUrl()` and navigates the browser to `/users/get-spotify-login-url`. The backend immediately redirects to Spotify with the scopes `user-read-playback-state`, `user-modify-playback-state`, `user-read-currently-playing`, `streaming`, `user-read-email`, and `user-read-private`.
2. **Spotify Consent & Callback:** After the user approves, Spotify calls `/users/getToken?code=...`. The backend swaps the code for access + refresh tokens via `Spotify.getToken`, fetches the user's profile, and either updates or creates the MongoDB document.
3. **Session Establishment (Backend):** `generateInternalToken` signs a 7-day JWT that stores `spotifyID`. The token is written to the `session_token` httpOnly cookie (currently flagged `secure: true`, `sameSite: "lax"`). This cookie authenticates every protected route and is also sent during the Socket.io handshake thanks to `withCredentials: true`.
4. **React Query Gate (Frontend):** On app load, `App.jsx` issues `checkAuth()` via React Query. Until it resolves truthy, all other queries stay disabled. Once authenticated, the app fetches `fetchUserProfile`, `fetchPlaylists`, `fetchPlayingTrack`, and `getSession` in parallel so the sidebar and dashboard can hydrate.
5. **Token Refresh (Backend):** Every time the frontend calls a Spotify-dependent route, `getSpotifyTokenFromDatabase` validates the stored access token (`validateSpotifyToken`) and silently refreshes it via `Spotify.refreshToken` when expired, updating the Mongo record through `databaseUpdateTokens`.
6. **Lobby Creation:** When the host selects a playlist and presses **Start Game**, `requestNewGame(gameSettings)` posts to `/game/request-new-game`. The server instantiates `GameState`, seeds `tracksToPlay`, and saves two Redis keys (`game:{spotifyID}` and `<code>`). Both keys expire after 7,200 seconds to prevent stale sessions.
7. **Lobby Guarding:** `GameDashboard` blocks multiple lobbies by checking `getSession`. If a session exists, it offers a prompt to return to `/lobby`. The `/lobby` route itself is protected by requiring both authentication and a session snapshot.
8. **Realtime Coordination:** The host's `/lobby` instance fetches the `gameCode`, connects Socket.io, and emits `join_game(code, "Host")`. Guests join via `/join`, which validates the six-digit code using `zod` + `react-hook-form`, then emits `join_game(code, nickname, callback)`.
9. **Game Start:** Once enough players join, the host clicks **Start game**, which emits `host_start_game(code)`. The server rehydrates `GameState`, calls `startGame()`, and emits `game_started` to all sockets in the room. Both the host view and guests swap their UI to the in-progress state upon receiving this event. Because `game_started` is not persisted back to Redis, reconnecting clients rely on the live socket event rather than the session snapshot to know if gameplay already started.
10. **Subsequent Requests:** All API helpers (`axios` calls with `withCredentials: true`) reuse the `session_token` cookie. When the cookie expires or is cleared, `checkAuth` falls back to `false`, which ejects the user back to `/login` and prevents further data fetches until they sign in again.

# Key Function Reference

## Backend

### GameState (constructor)

```ts
// backend/services/GameState.js
/**
 * Constructs the in-memory snapshot for a match and seeds fields persisted to Redis.
 * @param {string} spotifyID - Host's Spotify ID, used to derive the Redis key `game:{spotifyID}`.
 * @param {{gameLenght: number|string, gamePlayers: number, tracks: any[]}} gameSettings - Raw game options supplied by the frontend.
 * @returns {void}
 */
constructor(spotifyID, gameSettings);
```

### GameState.addPlayer

```ts
// backend/services/GameState.js
/**
 * Adds or replaces a lobby player keyed by their socket ID.
 * @param {{ id: string, name: string }} player - Socket context from the `join_game` event.
 * @returns {void}
 */
addPlayer(player);
```

### GameState.startGame & addPlayedTrack

```ts
// backend/services/GameState.js
/**
 * Flips the `gameStarted` flag so sockets know to transition into gameplay.
 * @returns {void}
 */
startGame();

/**
 * Pushes a track ID into `playedTracks` and advances `currentRound`.
 * @param {string} trackID - Spotify track identifier that was just used in a round.
 * @returns {number} Total tracks recorded so far.
 */
addPlayedTrack(trackID);
```

### setupSocketLogic

```ts
// backend/services/GameSocketService.js
/**
 * Wires Socket.io listeners for lobby management and gameplay triggers.
 * @param {import('fastify').FastifyInstance & { redis: import('redis').RedisClientType, io: import('socket.io').Server }} fastify - Fastify instance with Redis + Socket.io decorations.
 * @returns {void}
 */
function setupSocketLogic(fastify);
```

### getSpotifyTokenFromDatabase

```ts
// backend/services/userService.js
/**
 * Ensures a valid Spotify access token, refreshing and persisting new credentials when necessary.
 * @param {string} spotifyID - Logged-in user's Spotify ID.
 * @returns {Promise<string>} A usable Spotify access token.
 */
async function getSpotifyTokenFromDatabase(spotifyID);
```

### databaseUpdateTokens

```ts
// backend/services/userService.js
/**
 * Persists refreshed Spotify tokens and their expiration timestamp for an existing user document.
 * @param {string} spotifyID - User identifier in MongoDB.
 * @param {string} access_token - Fresh Spotify access token.
 * @param {string} refresh_token - Optional new refresh token.
 * @param {number} expires_in - Expiration window in seconds returned by Spotify.
 * @returns {Promise<User|null>} Updated Mongoose document or null when the user does not exist.
 */
async function databaseUpdateTokens(
  spotifyID,
  access_token,
  refresh_token,
  expires_in
);
```

### generateInternalToken

```ts
// backend/services/userService.js
/**
 * Signs the httpOnly JWT (`session_token`) that Fastify uses to guard protected routes.
 * @param {FastifyInstance} fastify - Fastify instance that registered `fastify-jwt`.
 * @param {{ spotifyID: string }} user - Mongo document or plain object containing the Spotify ID.
 * @returns {string} A JWT that expires in seven days.
 */
function generateInternalToken(fastify, user);
```

## Frontend

### requestNewGame

```ts
// src/api/gameApi.js
/**
 * Creates a lobby by POSTing the current game settings to `/game/request-new-game`.
 * @param {{ selectedPlaylist: object|null, playerCount: number, gameLength: string }} gameSettings - UI-level configuration captured on the dashboard.
 * @returns {Promise<{ created: boolean, gameID: string, gameCode: number }>} Redis identifiers for the new lobby.
 */
async function requestNewGame(gameSettings);
```

### getSession

```ts
// src/api/gameApi.js
/**
 * Retrieves the host's stored `GameState` so the UI can decide whether to redirect to the lobby.
 * @returns {Promise<{ gameSession: GameState }>} Snapshot serialized by the backend or throws when unauthenticated.
 */
async function getSession();
```

### getGameCode

```ts
// src/api/gameApi.js
/**
 * Fetches only the six-digit lobby code from `/game/get-game-code` and throws if none exists.
 * @returns {Promise<number>} The currently active lobby code.
 */
async function getGameCode();
```

### getSpotifyLoginUrl

```ts
// src/api/spotifyApi.js
/**
 * Returns the backend URL that triggers the Spotify OAuth redirect. Used by the login button.
 * @returns {string} Absolute URL (`http://127.0.0.1:3001/users/get-spotify-login-url`).
 */
function getSpotifyLoginUrl();
```

### exchangeCodeForToken

```ts
// src/api/spotifyApi.js
/**
 * Calls `/users/getToken` with the authorization code and resolves to `true` when `{ login: "success" }`.
 * @param {string} code - Authorization code appended by Spotify to the callback URL.
 * @returns {Promise<boolean>} Whether the backend accepted the code and issued the session cookie.
 */
async function exchangeCodeForToken(code);
```

### fetchPlaylists

```ts
// src/api/spotifyApi.js
/**
 * Wraps `GET /music/get-user-playlists` so the sidebar can display selectable playlists.
 * @returns {Promise<{ items: Array<object> }|null>} Spotify playlist payload or null on error.
 */
async function fetchPlaylists();
```

### fetchPlayingTrack

```ts
// src/api/spotifyApi.js
/**
 * Proxies `/music/currently-playing` and is polled with a dynamic interval based on the current track's remaining duration.
 * @returns {Promise<object|null>} Spotify's currently playing response or null when playback is idle.
 */
async function fetchPlayingTrack();
```

### getTracksFromPlaylist

```ts
// src/api/spotifyApi.js
/**
 * Loads the tracks for the selected playlist so the dashboard can validate game length requirements.
 * @param {{ id: string }} playlistData - Playlist reference returned by Spotify.
 * @returns {Promise<object|null>} Spotify playlist track payload.
 */
async function getTracksFromPlaylist(playlistData);
```

### Socket-driven helpers (GameLobby & JoinGamePage)

```ts
// src/pages/GameLobby.jsx
/**
 * Emits `host_start_game` with the lobby code when the host clicks Start.
 * @returns {void}
 */
const startGame = () => socket.emit("host_start_game", gameCode);

// src/pages/JoinGamePage.jsx
/**
 * Submits the join form, ensures the socket is connected, and emits `join_game` with a callback to surface validation errors.
 * @param {{ gameCode: string, username: string }} values - Form payload validated by zod.
 * @returns {void}
 */
const onSubmit = (values) => {
  /* ... */
};
```

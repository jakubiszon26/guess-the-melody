# Backend Documentation

## Overview

The backend is a Fastify server that owns Spotify authentication, music catalog queries, and multiplayer game orchestration. HTTP endpoints are grouped under `/users`, `/music`, and `/game`. MongoDB (via Mongoose) stores long-lived user records, Redis caches short-lived `GameState` snapshots, and Socket.io enables low-latency lobby coordination. All sensitive HTTP routes rely on a JWT stored in the `session_token` httpOnly cookie.

## Runtime Architecture

- **Fastify Core:** Registers cookies, CORS, and JWT plugins, then mounts the users/music/game route files.
- **MongoDB:** Persists Spotify-linked players with their latest access/refresh tokens (`userModel`).
- **Redis:** Stores serialized `GameState` instances under `game:{spotifyID}` plus a numeric code key `<gameCode>` for quick joins. Entries expire after 7,200 seconds.
- **Socket.io:** Decorated onto Fastify’s HTTP server; `setupSocketLogic` handles real-time lobby events.
- **Spotify Web API:** Accessed through `spotifyService` helpers for profile, playlist, track, and token operations.

## API Documentation

All responses are JSON unless noted. Any route decorated with `fastify.authenticate` requires the `session_token` cookie that is issued during login.

### Users Service (`backend/routes/users.js`)

#### `GET /users/get-spotify-login-url`

- **Description:** Redirects the caller to Spotify’s OAuth consent page with the required scopes.
- **Authentication:** None.
- **Parameters:** _(none)_
- **Success Response:** HTTP 302 redirect to `https://accounts.spotify.com/authorize?...`.
- **Error Response:**
  ```json
  { "error": "Unable to generate login URL" }
  ```

#### `GET /users/getToken`

- **Description:** Spotify callback handler. Exchanges the `code` query param for tokens, upserts/creates the MongoDB user, signs a JWT, and sets it as `session_token`.
- **Authentication:** None (Spotify calls it).
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

#### `GET /users/checkAuth`

- **Description:** Ensures the JWT cookie is valid and signals authentication status.
- **Authentication:** Required.
- **Parameters:** _(none)_
- **Success Response:** `{ "authenticated": true }`
- **Error Response:** `{ "error": "Unauthorized" }`

#### `GET /users/fetch-user-profile`

- **Description:** Pulls a fresh Spotify access token from MongoDB/Redis, proxies `GET /v1/me`, and returns the Spotify profile payload.
- **Authentication:** Required.
- **Parameters:** _(none)_
- **Success Response:**
  ```json
  {
    "display_name": "Player One",
    "email": "player@example.com",
    "id": "spotify_user_id",
    "images": [{ "url": "https://.../avatar.jpg" }]
  }
  ```
- **Error Response:** `{ "error": "Failed to fetch profile" }`

### Music Service (`backend/routes/music.js`)

#### `GET /music/currently-playing`

- **Description:** Proxies Spotify’s `GET /v1/me/player/currently-playing`. Sends `{ "is_playing": false }` when Spotify returns HTTP 204.
- **Authentication:** Required.
- **Parameters:** _(none)_
- **Success Response:** Spotify’s full currently-playing payload.
- **Error Response:** `{ "error": "Failed to fetch currently playing track" }`

#### `GET /music/get-user-playlists`

- **Description:** Returns the authenticated user’s playlists via `Spotify.playlists`.
- **Authentication:** Required.
- **Parameters:** _(none)_
- **Success Response:** Spotify playlist collection (items with `id`, `name`, `images`, etc.).
- **Error Response:** `{ "error": "couldnt get user playlists" }`

#### `GET /music/get-several-tracks`

- **Description:** Fetches up to 50 tracks at a time using `Spotify.tracks`.
- **Authentication:** Required.
- **Parameters:**
  | Name | Type | Location | Description |
  | --- | --- | --- | --- |
  | ids | string | query | Comma separated Spotify track IDs (max 50). |
- **Success Response:** `{ "tracks": [ { "id": "..." } ] }`
- **Error Response:** `{ "error": "ERROR IN /get-several-tracks" }`

#### `GET /music/get-tracks-from-playlist`

- **Description:** Loads playlist tracks via `Spotify.playlistTracks(playlistID)`.
- **Authentication:** Required.
- **Parameters:**
  | Name | Type | Location | Description |
  | --- | --- | --- | --- |
  | playlistID | string | query | Playlist identifier to inspect. |
- **Success Response:** Spotify playlist track payload (`items[].track`).
- **Error Response:** `{ "error": "ERROR IN /get-several-tracks" }`

#### `GET /music/get-ids-from-playlist`

- **Description:** Returns only the track IDs for the requested playlist.
- **Authentication:** Required.
- **Parameters:** `playlistID` (query).
- **Success Response:** `[ "1abc", "2def" ]`
- **Error Response:** `{ "error": "ERROR IN /get-ids-from-playlist" }`

#### `GET /music/convert-spotify-to-isrcs`

- **Description:** Breaks large `ids` lists into 50-track batches, fetches details, and maps Spotify IDs to ISRCs/title/artist metadata.
- **Authentication:** Required.
- **Parameters:** `ids` (query) – comma separated Spotify IDs.
- **Success Response:** Array of `{ spotifyID, isrc, title, artist }` documents.
- **Error Response:** `{ "error": "ERROR IN /convert-spotify-to-isrcs" }`

#### `POST /music/get-preview-from-deezer`

- **Description:** Given a `tracksArray` and `index`, queries Deezer by ISRC or artist/title to locate a 30s preview.
- **Authentication:** Required.
- **Body Parameters:** `tracksArray` (array), `index` (number).
- **Success Response:** `{ "previewUrl": "https://.../stream.mp3" }`
- **Error Response:** e.g. `{ "error": "index missing or type error" }`

### Game Service (`backend/routes/game.js`)

#### `POST /game/request-new-game`

- **Description:** Creates a `GameState` for the authenticated host, assigns a random six-digit code, and persists both `game:{spotifyID}` and `<code>` Redis keys (TTL 7200s).
- **Authentication:** Required.
- **Body Parameters:**
  | Name | Type | Description |
  | --- | --- | --- |
  | gameSettings | object | Expected to contain `gameLenght`, `gamePlayers`, and `tracks`. |
- **Success Response:** `{ "created": true, "gameID": "game:host", "gameCode": 123456 }`
- **Error Response:** `{ "error": "Failed to create game" }`

#### `GET /game/session`

- **Description:** Loads the host’s serialized `GameState` from Redis to determine whether a lobby already exists.
- **Authentication:** Required.
- **Success Response:** `{ "gameSession": { ...GameState } }`
- **Error Response:** `{ "error": "Failed to load session" }`

#### `GET /game/get-game-code`

- **Description:** Convenience endpoint that returns just the numeric `gameCode` for the authenticated host.
- **Authentication:** Required.
- **Success Response:** `{ "code": 123456 }`
- **Error Response:** `{ "error": "Failed to load session" }`

## WebSocket Game Flow (`backend/services/GameSocketService.js`)

| Event             | Direction       | Payload                   | Description                                                                                                                                                                               |
| ----------------- | --------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `join_game`       | Client ➜ Server | `(code, name, callback?)` | Resolves `code` to a Redis `gameID`, rehydrates `GameState`, assigns host/player membership, persists the updated state, and emits `update_players`. Host joins by sending name `"Host"`. |
| `host_start_game` | Client ➜ Server | `(code)`                  | Marks `gameState.gameStarted = true` and emits `game_started` to the room (currently not persisted back to Redis).                                                                        |
| `update_players`  | Server ➜ Client | `[{ id, name }]`          | Keeps every lobby view synchronized with the latest roster.                                                                                                                               |
| `game_started`    | Server ➜ Client | `boolean`                 | Signals that the host pressed Start. Both host and guests switch UI accordingly.                                                                                                          |
| `error`           | Server ➜ Client | `{ message }`             | Generic socket error payload used when a handler throws.                                                                                                                                  |

**Lifecycle:**

1. Host hits `/lobby`, fetches `gameCode`, connects Socket.io, and emits `join_game(code, "Host")` which stores their socket ID inside `GameState.hostID`.
2. Guests open `/join`, enter the code/name, and emit `join_game`. Validation failures or missing rooms are surfaced through the callback.
3. Every join recalculates the players array and broadcasts `update_players` to the room.
4. Host emits `host_start_game`; all clients listening for `game_started` update local state (e.g., `GameLobby`, `JoinGamePage`).

## Authentication & Session Management

1. `GET /users/get-spotify-login-url` redirects to Spotify with scopes `user-read-playback-state`, `user-modify-playback-state`, `user-read-currently-playing`, `streaming`, `user-read-email`, and `user-read-private`.
2. Spotify calls back into `/users/getToken?code=...`. `spotifyService.getToken` exchanges the code for `access_token`, `refresh_token`, and `expires_in`.
3. `userService.databaseUpdateTokens` / `databaseCreateUser` persist credentials and profile data, then `generateInternalToken` signs the 7-day JWT stored as `session_token` (httpOnly, sameSite=lax, secure=true in prod).
4. `fastify.decorate("authenticate", ...)` verifies the cookie for every protected route. Socket.io also relies on the same cookie because clients connect with `withCredentials: true`.
5. For Spotify calls, `getSpotifyTokenFromDatabase` checks token freshness via `validateSpotifyToken`; expired tokens trigger `spotifyService.refreshToken`, and MongoDB is updated with the new expiry.
6. Game sessions are persisted in Redis for two hours. Hosts can only run one active lobby at a time (`game:{spotifyID}` key). Guests rely on the numeric code lookup to join.

## Key Backend Functions

| Function                                 | Location                        | Description                                                                                                                                                        |
| ---------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `new GameState(spotifyID, gameSettings)` | `services/GameState.js`         | Seeds lobby metadata (`gameID`, `gameCode`, `tracksToPlay`, `players`, etc.) and exposes helpers like `addPlayer`, `startGame`, `addPlayedTrack`, and `setHostID`. |
| `setupSocketLogic(fastify)`              | `services/GameSocketService.js` | Attaches `join_game` and `host_start_game` listeners, manages Redis serialization, and emits lobby updates.                                                        |
| `spotifyService.*`                       | `services/spotifyService.js`    | Wraps Spotify profile/playlist/track fetches plus Authorization Code / refresh token flows.                                                                        |
| `userService` helpers                    | `services/userService.js`       | Provide user CRUD + token persistence (`checkIfUserExists`, `databaseUpdateTokens`, `generateInternalToken`, `getSpotifyTokenFromDatabase`).                       |
| `request-new-game` handler               | `routes/game.js`                | Validates auth, creates/persists `GameState`, and returns IDs/codes.                                                                                               |
| `getSpotifyLoginUrl`, `getToken`, etc.   | `routes/users.js`               | Manage the OAuth handshake and expose lightweight auth guard endpoints.                                                                                            |

## Error Handling

- All route handlers log caught exceptions before replying with a generic `{ "error": message }` payload.
- Spotify/Deezer/Redis errors surface descriptive messages in the logs to speed up debugging.
- JWT verification failures always respond with HTTP 401 `{ "error": "Unauthorized" }` so the frontend can redirect to `/login`.

## Data & State Lifetimes

- **JWT cookie:** 7 days (`fastify-jwt`).
- **Redis game session:** 7,200 seconds (2 hours) keyed by both `game:{spotifyID}` and the numeric `gameCode` string.
- **Mongo tokens:** Access token expiry tracked via `spotifyTokenExpiresAt`; refresh token stored indefinitely until Spotify revokes it.
- **WebSocket connections:** Live only for the current browser tab and automatically cleaned up when the socket disconnects.

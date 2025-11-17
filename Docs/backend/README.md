# Backend Documentation

## Overview

The backend is built with Fastify and centralizes authentication, Spotify data access, and multiplayer game orchestration. It exposes REST endpoints grouped by domain (`users`, `music`, `game`), persists user data in MongoDB via Mongoose models, stores transient game state in Redis, and authenticates browser clients with JWT cookies. Socket.io is mounted on the Fastify instance to enable near real-time game coordination.

## Runtime Architecture

- **Fastify Core:** Hosts all HTTP endpoints, applies CORS, cookies, and JWT verification.
- **MongoDB:** Stores Spotify-linked user records with credentials managed through `userService`.
- **Redis:** Caches `GameState` payloads for fast lookup during a session.
- **Socket.io:** Wired through `setupSocketLogic` to coordinate lobby membership. Hosts and guests join rooms via the `join_game` event so player rosters stay in sync in real time.
- **Spotify Web API:** Accessed via `spotifyService` helpers for profile, playlist, and track data.

## API Reference

All routes live under `/users`, `/music`, or `/game`. Unless noted otherwise, responses are JSON and protected endpoints require a valid `session_token` httpOnly cookie created during login.

### Users API (`backend/routes/users.js`)

#### `GET /users/get-spotify-login-url`

- **Description:** Builds the Spotify OAuth URL with the required scopes and issues an HTTP redirect so the browser can start the authorization flow.
- **Authentication:** Not required.
- **Parameters:** None.
- **Success Response:** `302 Found` redirecting to `https://accounts.spotify.com/authorize?...`.
- **Error Response:**
  ```json
  { "error": "Unable to generate login URL" }
  ```

#### `GET /users/getToken`

- **Description:** Spotify callback endpoint. Exchanges the `code` query param for access/refresh tokens, upserts the user in MongoDB, signs a JWT session, and sets it as the `session_token` cookie.
- **Authentication:** Not required (called by Spotify).
- **Parameters:**
  | Name | Type | Location | Description |
  | --- | --- | --- | --- |
  | `code` | string | query | Authorization code returned by Spotify after the user accepts scopes. |
- **Success Response:**
  ```json
  { "login": "success" }
  ```
- **Error Response:**
  ```json
  { "error": "No code provided" }
  ```

#### `GET /users/checkAuth`

- **Description:** Lightweight guard that verifies the JWT and returns whether the client is authenticated.
- **Authentication:** Required.
- **Parameters:** None.
- **Success Response:**
  ```json
  { "authenticated": true }
  ```
- **Error Response:**
  ```json
  { "error": "Unauthorized" }
  ```

#### `GET /users/fetch-user-profile`

- **Description:** Retrieves the stored Spotify access token, calls `Spotify.me`, and returns profile metadata for the signed-in user.
- **Authentication:** Required.
- **Parameters:** None.
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

### Music API (`backend/routes/music.js`)

#### `GET /music/currently-playing`

- **Description:** Uses the stored Spotify token to proxy `GET /v1/me/player/currently-playing`, returning the raw payload or `{ is_playing: false }` when Spotify replies with HTTP 204.
- **Authentication:** Required.
- **Parameters:** None.
- **Success Response:**
  ```json
  {
    "is_playing": true,
    "progress_ms": 61000,
    "item": {
      "name": "Song Title",
      "duration_ms": 180000,
      "artists": [{ "name": "Artist" }]
    }
  }
  ```
- **Error Response:**
  ```json
  { "error": "Failed to fetch currently playing track" }
  ```

#### `GET /music/get-user-playlists`

- **Description:** Calls `Spotify.playlists` to list the authenticated user’s playlists.
- **Authentication:** Required.
- **Parameters:** None.
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

#### `GET /music/get-several-tracks`

- **Description:** Accepts a comma-delimited list of track IDs and proxies `Spotify.tracks` to fetch them in bulk.
- **Authentication:** Required.
- **Parameters:**
  | Name | Type | Location | Description |
  | --- | --- | --- | --- |
  | `ids` | string | query | Comma-separated Spotify track IDs (max 50 per Spotify API). |
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

#### `GET /music/get-tracks-from-playlist`

- **Description:** Fetches the tracks inside a given playlist via `Spotify.playlistTracks` and returns Spotify’s response.
- **Authentication:** Required.
- **Parameters:**
  | Name | Type | Location | Description |
  | --- | --- | --- | --- |
  | `playlistID` | string | query | Spotify playlist identifier whose tracks should be loaded. |
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

### Game API (`backend/routes/game.js`)

#### `POST /game/request-new-game`

- **Description:** Initializes a `GameState` for the authenticated host, persists it in Redis for two hours, links a six digit `gameCode` to the lobby, and returns both identifiers so the host can share the code.
- **Authentication:** Required.
- **Body Parameters:**
  | Name | Type | Location | Description |
  | --- | --- | --- | --- |
  | `gameSettings` | object | body | Structure describing the chosen playlist, number of players, game length, etc. |
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

#### `GET /game/session`

- **Description:** Looks up the Redis entry for the current user (`game:{spotifyID}`) and returns the stored session snapshot if present.
- **Authentication:** Required.
- **Parameters:** None.
- **Success Response:**
  ```json
  {
    "gameSession": {
      "gameID": "game:spotify_user",
      "hostSpotifyID": "spotify_user",
      "gameLenght": "short",
      "players": {}
    }
  }
  ```
- **Error Response:**
  ```json
  { "error": "Failed to load session" }
  ```

#### `GET /game/get-game-code`

- **Description:** Looks up the current host’s `GameState` in Redis and returns the generated lobby code so it can be displayed inside the lobby UI.
- **Authentication:** Required.
- **Parameters:** None.
- **Success Response:**
  ```json
  { "code": 123456 }
  ```
- **Error Response:**
  ```json
  { "error": "Failed to load session" }
  ```

## Service Layer Reference (`backend/services/*.js`)

### `GameState`

- **Location:** `backend/services/GameState.js`
- **Purpose:** In-memory/Redis representation of an active match, keyed by `game:{hostSpotifyID}`.
- **Constructor Arguments:**
  - `spotifyID`: Host’s Spotify ID (used to derive `gameID`).
  - `gameSettings`: Object coming from the frontend. Currently expects `gameLenght`, `gamePlayers`, and `tracks` properties.
- **Fields:**
  - `gameID`, `gameCode`, `hostSpotifyID`, `hostID`, `gameLenght`, `maxPlayerCount`, `tracksToPlay`, `playedTracks`, `players`, `scores`, `currentRound`.
- **Methods:**
  - `addPlayer(player)`: Inserts a player record keyed by `player.id`.
  - `playerAddScore(player, score)`: Increments the tracked score for the player.
  - `addPlayedTrack(trackID)`: Pushes the track into `playedTracks` and advances `currentRound`.
  - `setHostID(socketID)`: Saves the host’s active socket connection so events can target the right room membership.

### `GameSocketService`

- **Location:** `backend/services/GameSocketService.js`
- **Purpose:** Attaches Socket.io listeners via `setupSocketLogic(fastify)`.
- **Behavior:**
  - Subscribes to `join_game` events. Hosts emit `(gameCode, "Host")` to claim room ownership and trigger the initial player list broadcast.
  - Guests emit `(gameCode, playerName, callback)`; the server resolves the numeric code to a `gameID`, rehydrates the `GameState`, assigns a generated name when none is provided, and persists the updated player roster back to Redis.
  - Emits `update_players` to the Socket.io room whenever the lobby changes so every client stays in sync. Errors are reported to the caller via the optional callback or `socket.emit("error", ...)`.

### `spotifyService`

- **Location:** `backend/services/spotifyService.js`
- **Responsibility:** Thin wrapper over Spotify Web API endpoints plus Authorization Code flow helpers.
- **Key Functions:**
  - `me(token)`: Returns the authenticated user profile.
  - `playlists(token)`: Lists user playlists.
  - `tracks(token, data)`: Fetches multiple tracks (`data.ids`).
  - `playlistTracks(token, playlistID)`: Loads playlist contents.
  - `getToken(code)`: Exchanges an authorization `code` for `access_token`, `refresh_token`, `expires_in` via Spotify’s token endpoint.
  - `refreshToken(refreshToken)`: Obtains a fresh access token when the current one expires.
  - `spotifyGet(...)`: Private helper encapsulating axios GET requests with bearer headers and query serialization.

### `userService`

- **Location:** `backend/services/userService.js`
- **Responsibility:** Bridges MongoDB user records, Spotify tokens, and Fastify’s JWT signer.
- **Key Functions:**
  - `checkIfUserExists(spotifyID)`: Boolean existence check.
  - `databaseUpdateTokens(spotifyID, access_token, refresh_token, expires_in)`: Refreshes stored tokens and expiry timestamp.
  - `databaseCreateUser(...)`: Creates a user document after first login, enriching it with Spotify profile data.
  - `validateSpotifyToken(spotifyID)`: Confirms whether the stored access token is still valid or needs refreshing.
  - `generateInternalToken(fastify, user)`: Signs the `session_token` (7-day expiry) containing the Spotify ID.
  - `getSpotifyTokenFromDatabase(spotifyID)`: Returns a valid token, triggering Spotify refresh logic when necessary.

## Error Handling & Logging

- Operations log to the console when Spotify calls fail or Redis interactions throw.
- API endpoints surface generic `{ "error": "..." }` payloads. Clients should inspect HTTP status codes to distinguish auth failures (401) from server issues (500).

## Session & State Management

- JWT cookies authenticate every protected route via Fastify’s `authenticate` decorator.
- Redis entries created by `POST /game/request-new-game` currently expire after 2 hours (7200 seconds) to prevent stale lobbies.
- Two keys are stored for each lobby: `game:{spotifyID}` holds the full `GameState`, and `<gameCode>` (stringified) points to the same `gameID`, enabling players to join by code without knowing the host’s ID.
- Extending gameplay (player joins, scoring) should reuse `GameState` helpers to ensure consistent mutation semantics before persisting back to Redis.

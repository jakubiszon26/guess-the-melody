// filepath: Docs/music/api_documentation.md

# Music API Documentation

This document provides a comprehensive overview of the music-related API endpoints for the "Guess the Melody" application.

## API Documentation

### Music Routes

#### `GET /music/currently-playing`

- **Description:** Gets the user's currently playing track on Spotify.
- **Authentication:** Requires a valid JWT session cookie.
- **Parameters:** None.
- **Success Response (200):**
  - A Spotify track object or `{ "is_playing": false }`.
- **Error Response (500):**
  ```json
  {
    "error": "Failed to fetch currently playing track"
  }
  ```

#### `GET /music/get-user-playlists`

- **Description:** Fetches the current user's playlists from Spotify.
- **Authentication:** Requires a valid JWT session cookie.
- **Parameters:** None.
- **Success Response (200):**
  - An object containing the user's playlists.
- **Error Response (500):**
  ```json
  {
    "error": "couldnt get user playlists"
  }
  ```

#### `GET /music/get-several-tracks`

- **Description:** Fetches information for several tracks from Spotify by their IDs.
- **Authentication:** Requires a valid JWT session cookie.
- **Parameters:**
  - `ids` (query): A comma-separated string of Spotify track IDs.
- **Success Response (200):**
  - An object containing a list of track objects.
- **Error Response (500):**
  ```json
  {
    "error": "..."
  }
  ```

#### `GET /music/get-tracks-from-playlist`

- **Description:** Fetches the tracks from a specific Spotify playlist.
- **Authentication:** Requires a valid JWT session cookie.
- **Parameters:**
  - `playlistID` (query): The ID of the Spotify playlist.
- **Success Response (200):**
  - An object containing the tracks of the playlist.
- **Error Response (500):**
  ```json
  {
    "error": "..."
  }
  ```

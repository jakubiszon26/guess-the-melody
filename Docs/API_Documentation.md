// filepath: Docs/API_Documentation.md

# Project Documentation

This document provides a comprehensive overview of the "Guess the Melody" application, including API endpoints, authentication flow, and key function descriptions.

## API Documentation

### User Routes

#### `GET /users/getToken`

- **Description:** Exchanges a Spotify authorization code for an access token and refresh token. It creates a new user in the database if one doesn't exist, or updates the tokens for an existing user. It then creates a JWT session cookie.
- **Authentication:** None.
- **Parameters:**
  - `code` (query): The authorization code from Spotify.
- **Success Response (200):**
  - Sets an `httpOnly` cookie named `session_token`.
- **Error Response (400):**
  ```json
  {
    "error": "No code provided"
  }
  ```

#### `GET /users/checkAuth`

- **Description:** Checks if the user has a valid JWT session.
- **Authentication:** Requires a valid JWT session cookie.
- **Parameters:** None.
- **Success Response (200):**
  ```json
  {
    "authenticated": true
  }
  ```
- **Error Response (401):**
  ```json
  {
    "error": "Unauthorized"
  }
  ```

#### `GET /users/fetch-user-profile`

- **Description:** Fetches the Spotify profile of the authenticated user.
- **Authentication:** Requires a valid JWT session cookie.
- **Parameters:** None.
- **Success Response (200):**
  - A Spotify user object.
- **Error Response (500):**
  - An error object.

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

## Authentication Flow

1.  **Frontend Initiates Login:** The user clicks the "Login to Spotify" link on the frontend, which redirects them to the Spotify authorization page.
2.  **Spotify Authorization:** The user logs in to Spotify and authorizes the application. Spotify then redirects the user back to the application's redirect URI (`http://127.0.0.1:3000/`) with an authorization `code` in the query parameters.
3.  **Code Exchange:** The frontend receives the `code` and makes a `GET` request to the backend at `/users/getToken`, sending the `code`.
4.  **Backend Token Exchange:** The backend's `/users/getToken` endpoint receives the `code` and makes a `POST` request to the Spotify API to exchange the `code` for an `access_token`, `refresh_token`, and `expires_in`.
5.  **User/Session Management:**
    - The backend uses the `access_token` to fetch the user's Spotify profile, including their `spotifyID`.
    - It checks if a user with that `spotifyID` already exists in the database.
    - If the user exists, their Spotify tokens are updated.
    - If the user does not exist, a new user is created with the tokens and profile information.
6.  **JWT Creation:** The backend generates a JWT (`session_token`) containing the user's `spotifyID`.
7.  **Cookie Setting:** The backend sends the `session_token` back to the frontend in a secure, `httpOnly` cookie.
8.  **Authenticated Requests:** For all subsequent requests to protected routes, the frontend automatically includes the `session_token` cookie. The backend uses the `authenticate` middleware to verify the JWT on each request.
9.  **Token Refresh:** The `getSpotifyTokenFromDatabase` service function automatically handles refreshing the Spotify access token using the refresh token if it has expired.

## Key Function Reference

### Backend

- `checkIfUserExists(spotifyID)`: Checks if a user exists in the database.
- `databaseUpdateTokens(spotifyID, access_token, refresh_token, expires_in)`: Updates a user's Spotify tokens.
- `databaseCreateUser(spotifyID, access_token, refresh_token, expires_in)`: Creates a new user in the database.
- `generateInternalToken(fastify, user)`: Generates a JWT for a user session.
- `getSpotifyTokenFromDatabase(spotifyID)`: Retrieves a valid Spotify access token for a user, refreshing it if necessary.
- `Spotify.me(token)`: Fetches the user's profile from Spotify.
- `Spotify.getToken(code)`: Exchanges an authorization code for Spotify tokens.
- `Spotify.refreshToken(refreshToken)`: Refreshes a Spotify access token.

### Frontend

- `exchangeCodeForToken(code)`: Sends the authorization code to the backend.
- `fetchUserProfile()`: Fetches the user's profile from the backend.
- `checkAuth()`: Checks if the user is authenticated with the backend.
- `fetchPlayingTrack()`: Fetches the user's currently playing track.

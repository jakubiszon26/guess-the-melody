// filepath: Docs/users/api_documentation.md

# Users API Documentation

This document provides a comprehensive overview of the user-related API endpoints for the "Guess the Melody" application.

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

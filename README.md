# 🎵 Guess the melody — Multiplayer Music Quiz Game

> ⚠️ **Warning**
>
> Due to recent changes in Spotify's API policies (restricted access to extended API features), logging into the Vercel-hosted instance is currently restricted to whitelisted users.
>
> If you wish to test the application without running it locally, please **contact me** so I can add your email to the allowlist in the Spotify Developer Dashboard.
>
> _I am currently working on a public demo mode that will not require Spotify login._

## 📖 Project Description

**Guess the melody** is a multiplayer game inspired by Kahoot, where players must guess song titles based on 30-second music previews. One player acts as the **host**, launching the game on a larger screen and selecting a playlist, while others join using their phones, which serve as controllers.

https://github.com/user-attachments/assets/741c6daa-10a6-40e7-b8dc-74463fa66162

## 🚀 Features

- 🔐 Host login via Spotify (OAuth 2.0)

- 🎶 Playlist selection for the game

- 📱 Player joining via 6-digit code

- 📲 Mobile phones as controllers

- 🔊 30-second music rings from Deezer API

- ⏱️ Round timer on the main screen

- 🥇 Scoreboard after each round

- 🔄 Real-time updates via WebSockets (Socket.io)

- 🤖 Player game session persistence - re-join

---

### 🔊 How does the game work?

- The Host logs in with Spotify and selects a playlist to base the game on.

- Music is not played directly from Spotify — instead, the app uses the **Deezer API**, verifying songs via **ISRC** codes.

- If an ISRC code is unavailable, a text-based search (_fuzzy search_) is performed.

- Players join the lobby using a **six-digit code**.

- The host's main screen displays:

  - A countdown timer,

  - Scores after each round,

  - Plays music

## 🧩 Technologies

### **Frontend**

- **Framework**: Vite + React ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white) ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)

- **UI Library**: Shadcn/UI (Radix UI + Tailwind CSS) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

- **Real-time**: Socket.io (Client) ![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)

### **Backend**

- **Runtime**: Node.js ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)

- **Framework**: Fastify ![Fastify](https://img.shields.io/badge/fastify-%23000000.svg?style=for-the-badge&logo=fastify&logoColor=white)

- **Database**: MongoDB + Mongoose ![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)

- **Cache**: Redis (for game state management) ![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)

- **Real-time**: Socket.io (Server) ![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)

### **Integrations**

- **Spotify API**: Host authentication, playlist fetching.

- **Deezer API**: Fetching 30-second song previews.

## 🔧 Technical Details

### Architecture Overview

The application follows a client-server architecture with real-time communication.

- **Frontend**: Handles the UI for both the Host (Dashboard, Game Screen) and Players (Mobile Controller). It communicates with the backend via REST API for auth/data and Socket.io for game state.

- **Backend**: Manages user sessions, game logic, and external API integrations.

- **Redis**: Used as a fast, in-memory store for active game states (lobbies, scores, current round info) to ensure low latency.

- **MongoDB**: Stores user profiles and persistent data.

### Authentication Flow

1.  **Initiation**: Host clicks "Login with Spotify".

2.  **Redirect**: Backend redirects to Spotify Authorization URL with required scopes (`user-read-private`, `playlist-read-private`, etc.).

3.  **Callback**: Spotify redirects back to `/users/getToken` with an authorization code.

4.  **Token Exchange**: Backend exchanges the code for an Access Token and Refresh Token.

5.  **Session**: Backend creates or updates the user in MongoDB and issues a secure HTTP-only cookie (`session_token`) containing an internal JWT.

### Music Data Flow (Spotify → Deezer)

To avoid Spotify's playback restrictions for games, the app uses Deezer for audio previews:

1.  **Fetch**: Backend fetches tracks from the selected Spotify playlist.

2.  **Match**: For each track, the `DeezerService` attempts to find a matching preview:

- **Strategy A (ISRC)**: Queries Deezer API with the track's unique ISRC code (`isrc:<code`). This is the most accurate method.

- **Strategy B (Fuzzy Search)**: If ISRC fails, it falls back to searching by `artist:"Name" track:"Title"`.

3.  **Playback**: The resulting 30-second preview URL is sent to the frontend for playback.

### 📡 Socket.io Communication

The game relies heavily on event-driven communication:

- `join_game`: Sent by player with a game code. Backend validates code against Redis.

- `update_players`: Broadcasted to lobby when a player joins/leaves.

- `host_start_game`: Triggered by host to initialize the game engine.

- `game_started`: Signals all clients to switch to the game view.

- `host_ready`: Host client signals it's ready to play the next track.

- `player_answer`: Sent when a player selects an answer. Backend calculates points based on speed and correctness.

- `host_round_ended`: Signals the end of a round to show results.

## 📦 Project Structure

```

📂 guess-the-melody/

├── 📂 backend/ # Node.js + Fastify Server

│ ├── 📂 config/ # DB config

│ ├── 📂 models/ # Mongoose Models

│ ├── 📂 routes/ # API Routes (Auth, Music, Game)

│ ├── 📂 services/ # Business Logic (Deezer, Spotify, GameEngine)

│ └── backend.js # Entry point

├── 📂 src/ # React Frontend

│ ├── 📂 api/ # API handler functions & Socket clients

│ ├── 📂 components/ # Reusable UI components

│ ├── 📂 pages/ # Main application views

│ └── ...

└── ...

```

## 🐳Run using Docker
You can run the entire stack (App + Redis + MongoDB) using Docker Compose.
### Prerequesities
- Spotify Developer App (Client ID & Secret)
### Setup
1. **Create ```.env``` file in the root directory with these required variables:**
```env
# App URLs
ORIGIN_URL=[http://127.0.0.1:3000](http://127.0.0.1:3000)
VITE_BACKEND_URL=[http://127.0.0.1:3001](http://127.0.0.1:3001)

# Auth
JWT_SECRET=your_super_secret_key

# Spotify API
SPOTIFY_CLIENT_ID=your_id
SPOTIFY_CLIENT_SECRET=your_secret
SPOTIFY_REDIRECT_URI=[http://127.0.0.1:3000/login](http://127.0.0.1:3000/login)
SPOTIFY_ENDPOINT=[https://accounts.spotify.com/authorize](https://accounts.spotify.com/authorize)
SPOTIFY_TOKEN_URI=[https://accounts.spotify.com/api/token](https://accounts.spotify.com/api/token)
```
(Note: DB connection strings are handled automatically by Docker Compose)
<br /><br />

2.  **Run the App**
   
```
docker-compose up --build
```

## 🛠️ How to Run Locally

### Prerequisites

- Node.js (v20+)

- MongoDB instance

- Redis instance

- Spotify Developer App (Client ID & Secret)

### Setup

1.  **Clone the repository**

```bash

git clone https://github.com/jakubiszon26/guess-the-melody.git

cd guess-the-melody

```

2.  **Install Dependencies**

```bash

# Install dependencies

npm install

```

3.  **Environment Variables**

Create a `.env` file in the root directory with:

```env
SPOTIFY_CLIENT_SECRET=
SPOTIFY_CLIENT_ID=
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/login
SPOTIFY_TOKEN_URI=https://accounts.spotify.com/api/token
SPOTIFY_ENDPOINT = https://accounts.spotify.com/authorize
ORIGIN_URL=http://127.0.0.1:3000
BACKEND_PORT=3001
BACKEND_HOST=localhost
MONGO_URI=mongodb://...
JWT_SECRET=
REDIS_URI=redis://...
VITE_BACKEND_URL=http://127.0.0.1:3001
```

4.  **Run the Project**

```bash

# Run Backend

npm run dev:backend



# Run Frontend (in a separate terminal)

npm run dev:frontend

```

## 📄 License

Project available under the **MIT** license.

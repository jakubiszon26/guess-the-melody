import axios from "axios";
import "dotenv/config";
const tokenurl = process.env.SPOTIFY_TOKEN_URI;
const redirecturi = process.env.SPOTIFY_REDIRECT_URI;
const clientid = process.env.SPOTIFY_CLIENT_ID;
const clientsecret = process.env.SPOTIFY_CLIENT_SECRET;

const credentials = `${clientid}:${clientsecret}`;
const encodedCredentials = Buffer.from(credentials).toString("base64");

async function spotifyGet(token, endpoint, data) {
  if (!token) {
    throw new Error("no token");
  }
  if (!data) {
    data = {};
  }
  const queryData = new URLSearchParams(data);
  try {
    const response = await axios.get(endpoint, {
      params: queryData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.error("Error fetching data", error);
    throw new Error(error);
  }
}

const Spotify = {
  async me(token) {
    if (!token) {
      return null;
    }
    try {
      const response = await axios.get("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching user data", error);
      throw new Error(error);
    }
  },
  async playlists(token) {
    if (!token) {
      return null;
    }
    try {
      const response = await axios.get(
        "https://api.spotify.com/v1/me/playlists",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching playlists data", error);
      throw new Error(error);
    }
  },
  async tracks(token, data) {
    try {
      const response = await spotifyGet(
        token,
        "https://api.spotify.com/v1/tracks",
        data
      );
      if (response.data) {
        return response.data;
      }
    } catch (error) {
      console.error("Error fetching tracks data", error);
      throw new Error(error);
    }
  },
  async playlistTracks(token, playlistID) {
    try {
      const response = await spotifyGet(
        token,
        `https://api.spotify.com/v1/playlists/${playlistID}/tracks`
      );
      if (response.data) {
        return response.data;
      }
    } catch (error) {
      console.error("Error fetching playlists tracks data", error);
      throw new Error(error);
    }
  },
  async getToken(code) {
    const data = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirecturi,
    });

    try {
      const response = await axios.post(tokenurl, data, {
        headers: {
          Authorization: `Basic ${encodedCredentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      const { access_token, refresh_token, expires_in } = response.data;
      return { access_token, refresh_token, expires_in };
    } catch (error) {
      throw new Error(error);
    }
  },
  async refreshToken(refreshToken) {
    try {
      if (refreshToken) {
        const data = new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          redirect_uri: redirecturi,
        });
        const response = await axios.post(tokenurl, data, {
          headers: {
            Authorization: `Basic ${encodedCredentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });
        const { access_token, refresh_token, expires_in } = response.data;
        return { access_token, refresh_token, expires_in };
      }
    } catch (error) {
      throw error;
    }
  },
};

export default Spotify;

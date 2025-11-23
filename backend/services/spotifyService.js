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
      let allItems = [];
      let url = `https://api.spotify.com/v1/playlists/${playlistID}/tracks`;
      let firstResponseData = null;

      while (url) {
        const response = await spotifyGet(token, url);
        if (response.data) {
          if (!firstResponseData) {
            firstResponseData = response.data;
          }
          if (response.data.items) {
            allItems = [...allItems, ...response.data.items];
          }
          url = response.data.next;
        } else {
          url = null;
        }
      }

      if (firstResponseData) {
        return {
          ...firstResponseData,
          items: allItems,
          next: null,
        };
      }
      return null;
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
  async getTrackIDsFromPlaylist(token, playlistID) {
    try {
      let allTrackIDs = [];
      let url = `https://api.spotify.com/v1/playlists/${playlistID}/tracks`;

      while (url) {
        const response = await spotifyGet(token, url);

        if (response.data && response.data.items) {
          const trackIDs = response.data.items
            .map((item) => {
              if (item.track && item.track.id) {
                return item.track.id;
              }
              return null;
            })
            .filter((id) => id !== null);

          allTrackIDs = [...allTrackIDs, ...trackIDs];
        }
        url = response.data.next;
      }

      return allTrackIDs;
    } catch (error) {
      console.error("Error ", error);
      throw error;
    }
  },
  async convertTrackID(token, trackIDsString) {
    try {
      const allIds = trackIDsString
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);

      const chunks = [];
      for (let i = 0; i < allIds.length; i += 50) {
        chunks.push(allIds.slice(i, i + 50));
      }

      const responses = await Promise.all(
        chunks.map(async (chunk) => {
          const idsString = chunk.join(",");
          const res = await Spotify.tracks(token, { ids: idsString });
          return res?.tracks || res?.data?.tracks || [];
        })
      );

      const allTracks = responses.flat();

      const result = allTracks
        .map((track) => {
          if (track && track.id) {
            return {
              spotifyID: track.id,
              isrc: track.external_ids?.isrc || null,
              title: track.name,
              artist: track.artists[0]?.name || "Unknown Artist",
            };
          }
          return null;
        })
        .filter((item) => item !== null);

      return result;
    } catch (error) {
      console.error("Błąd w convertTrackID:", error.message);
      throw error;
    }
  },
};

export default Spotify;

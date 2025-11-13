import axios from "axios";
import { getSpotifyTokenFromDatabase } from "../services/userService.js";
import Spotify from "../services/spotifyService.js";

export default async function musicRoutes(fastify, options) {
  fastify.get(
    "/currently-playing",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const token = await getSpotifyTokenFromDatabase(request.user.spotifyID);
        const response = await axios.get(
          "https://api.spotify.com/v1/me/player/currently-playing",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.status === 204) {
          return reply.send({ is_playing: false });
        }
        console.log("Currently playing response:", response.data);
        reply.send(response.data);
      } catch (error) {
        console.error("Error fetching currently playing track", error);
        reply
          .status(500)
          .send({ error: "Failed to fetch currently playing track" });
      }
    },
    fastify.get(
      "/get-user-playlists",
      { preHandler: [fastify.authenticate] },
      async (request, reply) => {
        try {
          const token = await getSpotifyTokenFromDatabase(
            request.user.spotifyID
          );
          const userPlaylists = await Spotify.playlists(token);
          if (userPlaylists) {
            reply.send(userPlaylists);
          } else {
            throw new Error("couldnt get user playlists");
          }
        } catch (error) {
          console.error(" Error in /get-user-playlists:", error);
          reply.status(500).send({ error: error.message });
        }
      }
    )
  );
  fastify.get(
    "/get-several-tracks",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const token = await getSpotifyTokenFromDatabase(request.user.spotifyID);
        const ids = request.query.ids;
        const spotifyTracks = await Spotify.tracks(token, { ids: ids });
        if (spotifyTracks) {
          return spotifyTracks;
        }
      } catch (error) {
        console.error("ERROR IN /get-several-tracks:", error);
        reply.status(500).send({ error: error.message });
      }
    }
  );
  fastify.get(
    "/get-tracks-from-playlist",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const token = await getSpotifyTokenFromDatabase(request.user.spotifyID);
        const playlistID = request.query.playlistID;
        const playlistTracks = await Spotify.playlistTracks(token, playlistID);
        if (playlistTracks) {
          return playlistTracks;
        }
      } catch (error) {
        console.error("ERROR IN /get-several-tracks:", error);
        reply.status(500).send({ error: error.message });
      }
    }
  );
}

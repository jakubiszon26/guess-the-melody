import axios from "axios";
import { getSpotifyTokenFromDatabase } from "../services/userService.js";
import Spotify from "../services/spotifyService.js";
import Deezer from "../services/DeezerService.js";

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
  fastify.get(
    "/get-ids-from-playlist",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const token = await getSpotifyTokenFromDatabase(request.user.spotifyID);
        if (request.query.playlistID) {
          const trackIDs = await Spotify.getTrackIDsFromPlaylist(
            token,
            request.query.playlistID
          );
          reply.send(trackIDs);
        }
      } catch (error) {
        console.error("ERROR IN /get-ids-from-playlist:", error);
        reply.status(500).send({ error: error.message });
      }
    }
  );

  fastify.get(
    "/convert-spotify-to-isrcs",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        if (request.query.ids) {
          const token = await getSpotifyTokenFromDatabase(
            request.user.spotifyID
          );
          const isrcs = await Spotify.convertTrackID(token, request.query.ids);
          reply.send(isrcs);
        }
      } catch (error) {
        console.error("ERROR IN /convert-spotify-to-isrcs", error);
        reply.status(500).send({ error: error.message });
      }
    }
  );
  fastify.post(
    "/get-preview-from-deezer",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { tracksArray, index } = request.body;

        if (!tracksArray || !Array.isArray(tracksArray)) {
          return reply.status(400).send({
            error: "Missing 'tracksArray'",
          });
        }

        if (index === undefined || typeof index !== "number") {
          return reply
            .status(400)
            .send({ error: "index missing or type error" });
        }

        if (index < 0 || index >= tracksArray.length) {
          return reply.status(400).send({ error: "index over array lenght" });
        }

        const preview = await Deezer.getTrackPreview(tracksArray, index);

        reply.send({ previewUrl: preview });
      } catch (error) {
        console.error("ERROR IN /get-preview-from-deezer", error);
        reply.status(500).send({ error: error.message });
      }
    }
  );
}

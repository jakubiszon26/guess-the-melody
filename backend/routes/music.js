import axios from "axios";
import spotifyPreviewFinder from "spotify-preview-finder";

export default async function musicRoutes(fastify, options) {
  fastify.get("/currently-playing", async (request, reply) => {
    const token = request.cookies.access_token;
    if (!token) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    try {
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
  });

  fastify.get("/get-track-info", async (request, reply) => {
    const token = request.cookies.access_token;
    const trackId = request.query.id;

    if (!token) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    if (!trackId) {
      return reply.status(400).send({ error: "Track ID is required" });
    }

    try {
      const response = await axios.get(
        `https://api.spotify.com/v1/tracks/${trackId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Track info response:", response.data);
      reply.send(response.data);
    } catch (error) {
      console.error("Error fetching track info", error);
      reply.status(500).send({ error: "Failed to fetch track info" });
    }
  });

  fastify.get("/find-preview-url", async (request, reply) => {
    const response = await spotifyPreviewFinder(
      request.query.track,
      request.query.artist,
      1
    );
    console.log("HTUHAK", response[0].previewUrls[0]);
  });
}

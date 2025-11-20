import { randomInt } from "crypto";
import { GameState } from "../services/GameState.js";
import Spotify from "../services/spotifyService.js";
import { getSpotifyTokenFromDatabase } from "../services/userService.js";
async function gameRoutes(fastify, options) {
  fastify.post(
    "/request-new-game",
    { preHandler: [fastify.authenticate] },
    async function (request, reply) {
      try {
        const spotifyID = request.user.spotifyID;
        const token = await getSpotifyTokenFromDatabase(spotifyID);
        const gameSettings = request.body.gameSettings;
        if (spotifyID && gameSettings) {
          //game settings to tylko selectedPlaylist, playerCount i gameLenght
          //bede musial pobrac piosenki, ktore chce grac. Najlepiej miec je w formie tracksArray
          const trackIDs = await Spotify.getTrackIDsFromPlaylist(
            token,
            gameSettings.selectedPlaylist.id
          );
          const trackIDsString = trackIDs.join(",");
          const tracksArray = await Spotify.convertTrackID(
            token,
            trackIDsString
          );

          const finalGameSettings = {
            selectedPlaylist: gameSettings.selectedPlaylist,
            playerCount: gameSettings.playerCount,
            gameLenght: gameSettings.gameLength,
            tracksArray: tracksArray,
          };

          const gameState = new GameState(spotifyID, finalGameSettings);
          const gameCode = randomInt(999999);
          gameState.gameCode = gameCode;

          await fastify.redis.set(gameState.gameID, JSON.stringify(gameState));
          await fastify.redis.expire(gameState.gameID, 7200);

          await fastify.redis.set(
            gameState.gameCode.toString(),
            gameState.gameID
          );
          await fastify.redis.expire(gameState.gameCode.toString(), 7200);

          reply.send({
            created: true,
            gameID: gameState.gameID,
            gameCode: gameCode,
          });
        } else {
        }
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
  );
  fastify.get(
    "/session",
    { preHandler: [fastify.authenticate] },
    async function (request, reply) {
      try {
        const spotifyID = request.user.spotifyID;
        if (spotifyID) {
          const rawData = await fastify.redis.get(`game:${spotifyID}`);
          if (rawData) {
            const gameState = JSON.parse(rawData);
            reply.send({ gameSession: gameState });
          }
        }
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
  );
  fastify.get(
    "/get-game-code",
    { preHandler: [fastify.authenticate] },
    async function (request, reply) {
      try {
        const spotifyID = request.user.spotifyID;
        if (spotifyID) {
          const rawData = await fastify.redis.get(`game:${spotifyID}`);
          if (rawData) {
            const gameState = JSON.parse(rawData);
            reply.send({ code: gameState.gameCode });
          }
        }
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
  );
  fastify.post(
    "/discard-game",
    { preHandler: [fastify.authenticate] },
    async function (request, reply) {
      try {
        const spotifyID = request.user.spotifyID;
        await fastify.redis.del(`game:${spotifyID}`);
        reply.send({ success: true });
      } catch (error) {
        console.error(error);
      }
    }
  );
}
export default gameRoutes;

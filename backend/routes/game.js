import { randomInt } from "crypto";
import { GameState } from "../services/GameState.js";

async function gameRoutes(fastify, options) {
  fastify.post(
    "/request-new-game",
    { preHandler: [fastify.authenticate] },
    async function (request, reply) {
      try {
        const spotifyID = request.user.spotifyID;
        const gameSettings = request.body.gameSettings;
        if (spotifyID && gameSettings) {
          const gameState = new GameState(spotifyID, gameSettings);
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
}
export default gameRoutes;

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
          await fastify.redis.set(gameState.gameID, JSON.stringify(gameState));
          await fastify.redis.expire(gameState.gameID, 7200);
          reply.send({ created: true, gameID: gameState.gameID });
        } else {
        }
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
  );
}
export default gameRoutes;

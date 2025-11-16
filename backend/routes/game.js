import { json } from "stream/consumers";
import { GameState } from "../services/GameState";

async function gameRoutes(fastify, options) {
  fastify.get(
    "/request-new-game",
    { preHandler: [fastify.authenticate] },
    async function (request, reply) {
      try {
        const spotifyID = request.user.spotifyID;
        const displayName = request.query.displayName;
        const gameSettings = request.query.gameSettings;
        if (spotifyID && gameSettings && displayName) {
          const gameState = new GameState(spotifyID, gameSettings);
          await fastify.redis.set(gameState.gameID, JSON.stringify(gameState));
          await fastify.redis.expire(gameState.gameID, 7200);
          reply.send({ created: true });
        }
      } catch {}
    }
  );
}
export default gameRoutes;

import { randomInt } from "crypto";
import { GameState } from "./GameState.js";
import {
  handleRoundEnd,
  hydrateGameObject,
  startGameEngine,
  handlePlayerAnswer,
} from "./GameEngine.js";

export function setupSocketLogic(fastify) {
  fastify.io.on("connection", (socket) => {
    socket.on("join_game", async (code, name, callback) => {
      try {
        if (code) {
          const gameID = await fastify.redis.get(code.toString());
          if (gameID) {
            const rawData = await fastify.redis.get(gameID);
            if (rawData) {
              const plainObject = JSON.parse(rawData);
              const gameState = new GameState(null, {
                gameLength: 0,
                gamePlayers: 0,
                tracksArray: [],
              });
              Object.assign(gameState, plainObject);
              if (name === "Host") {
                gameState.setHostID(socket.id);
                socket.join(gameID);
                await fastify.redis.set(gameID, JSON.stringify(gameState));
                const playersList = Object.values(gameState.players);
                fastify.io.to(gameID).emit("update_players", playersList);

                return;
              }
              gameState.addPlayer({
                id: socket.id,
                name: name || `Player ${randomInt(9999)}`,
              });

              await fastify.redis.set(gameID, JSON.stringify(gameState));
              if (typeof callback === "function") {
                callback({
                  success: true,
                  name: name,
                });
              }
              socket.join(gameID);

              const playersList = Object.values(gameState.players);
              fastify.io.to(gameID).emit("update_players", playersList);
            }
          } else {
            if (typeof callback === "function") {
              callback({ success: false, error: "No game with provided ID" });
            }
          }
        }
      } catch (error) {
        console.error(error);
        socket.emit("error", {
          message: "Error in join game",
        });
      }
    });
    socket.on("host_start_game", async (code, callback) => {
      const gameID = await fastify.redis.get(code.toString());
      if (gameID) {
        const gameState = await hydrateGameObject(fastify, gameID);
        gameState.startGame();
        await fastify.redis.set(gameID, JSON.stringify(gameState));
        if (gameState.gameStarted) {
          fastify.io.to(gameID).emit("game_started", gameState.gameStarted);
        }
      }
    });
    socket.on("host_ready", async (gameID) => {
      await startGameEngine(fastify, gameID);
    });
    socket.on("host_round_ended", async (gameID) => {
      await handleRoundEnd(fastify, gameID);
    });
    socket.on("player_answer", async ({ gameID, playerAnswer }) => {
      console.log("Player answered!");
      await handlePlayerAnswer(fastify, gameID, socket.id, playerAnswer);
    });
  });
}

import { randomInt } from "crypto";
import { GameState } from "./GameState.js";
import {
  handleRoundEnd,
  hydrateGameObject,
  startGameEngine,
  handlePlayerAnswer,
} from "./GameEngine.js";
import { SocketAddress } from "net";

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
    socket.on("re_join_game", async (oldSocketID, code, callback) => {
      try {
        if (code) {
          const gameID = await fastify.redis.get(code.toString());
          if (gameID) {
            const gameState = await hydrateGameObject(fastify, gameID);
            //
            console.log("player rejoin old: ", oldSocketID, "new: ", socket.id);

            if (!gameState.players[oldSocketID]) {
              if (typeof callback === "function") {
                callback({
                  success: false,
                  error: "Player not found in game",
                });
              }
              return;
            }

            gameState.players[oldSocketID].id = socket.id;
            delete Object.assign(gameState.players, {
              [socket.id]: gameState.players[oldSocketID],
            })[oldSocketID];

            if (gameState.playerAnswers[oldSocketID]) {
              delete Object.assign(gameState.playerAnswers, {
                [socket.id]: gameState.playerAnswers[oldSocketID],
              })[oldSocketID];
            }

            if (gameState.scores[oldSocketID]) {
              gameState.scores[oldSocketID].id = socket.id;
              delete Object.assign(gameState.scores, {
                [socket.id]: gameState.scores[oldSocketID],
              })[oldSocketID];
            }

            await fastify.redis.set(gameID, JSON.stringify(gameState));
            if (typeof callback === "function") {
              callback({
                success: true,
              });
            }
            socket.join(gameID);
          }
        } else {
          if (typeof callback === "function") {
            callback({
              success: false,
              error: "Game you try to rejoin does not exist anymore",
            });
          }
        }
      } catch (error) {
        throw error;
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

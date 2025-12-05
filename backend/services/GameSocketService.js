import {
  handleRoundEnd,
  startGameEngine,
  handlePlayerAnswer,
  joinGame,
  rejoinGame,
  hostStartGame,
} from "./GameEngine.js";

export function setupSocketLogic(fastify) {
  fastify.io.on("connection", (socket) => {
    socket.on("join_game", async (code, name, callback) => {
      await joinGame(fastify, socket, code, name, callback);
    });
    socket.on("re_join_game", async (oldSocketID, code, callback) => {
      await rejoinGame(fastify, socket, oldSocketID, code, callback);
    });
    socket.on("host_start_game", async (code, callback) => {
      await hostStartGame(fastify, code);
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

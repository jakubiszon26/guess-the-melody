import { randomInt } from "crypto";
import Deezer from "./DeezerService.js";
import { GameState } from "./GameState.js";
import stringSimilarity from "string-similarity";

export async function hydrateGameObject(fastify, gameID) {
  try {
    const rawData = await fastify.redis.get(gameID);
    if (!rawData) return;

    const plainObject = JSON.parse(rawData);
    const gameState = new GameState(null, {
      gameLenght: 0,
      gamePlayers: 0,
      tracksArray: [],
      hostSpotifyID: "",
      gameLength: 0,
      playedTracks: [],
      players: {},
      playerAnswers: {},
      scores: {},
      currentRound: 0,
    });
    Object.assign(gameState, plainObject);
    return gameState;
  } catch (error) {
    console.error(error);
  }
}

function cleanString(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/\(.*\)/g, "")
    .replace(/\[.*\]/g, "")
    .replace(/-.*$/, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

export async function joinGame(fastify, socket, code, name, callback) {
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
}

export async function rejoinGame(fastify, socket, oldSocketID, code, callback) {
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
}

export async function hostStartGame(fastify, code) {
  const gameID = await fastify.redis.get(code.toString());
  if (gameID) {
    const gameState = await hydrateGameObject(fastify, gameID);
    gameState.startGame();
    await fastify.redis.set(gameID, JSON.stringify(gameState));
    if (gameState.gameStarted) {
      fastify.io.to(gameID).emit("game_started", gameState.gameStarted);
    }
  }
}

export async function startGameEngine(fastify, gameID) {
  try {
    const gameState = await hydrateGameObject(fastify, gameID);
    if (!gameState) {
      console.error("hydration problem");
      return;
    }

    if (
      (gameState.gameLength === "short" && gameState.currentRound === 7) ||
      (gameState.gameLength === "mid" && gameState.currentRound === 15) ||
      (gameState.gameLength === "long" && gameState.currentRound === 30)
    ) {
      handleGameFinish(fastify, gameID, gameState);
      return;
    }

    const nextSong = await chooseRandomSong(gameState);

    if (!nextSong) {
      console.error("no more songs");
      return;
    }

    gameState.addPlayedTrack(nextSong.trackIndex);
    gameState.playerAnswers = {};
    gameState.currentRound++;
    await fastify.redis.set(gameID, JSON.stringify(gameState));
    const screenState = "guessing";
    fastify.io.to(gameState.hostID).emit("start_round", {
      currentRound: gameState.currentRound,
      songPreview: nextSong.previewUrl,
      trackInfo: nextSong.trackInfo,
      screenState: screenState,
    });
    fastify.io.to(gameID).emit("player_round_start", {
      round: gameState.currentRound,
      gameID: gameID,
      screenState: screenState,
      gameMode: gameState.gameMode,
    });
  } catch (error) {
    console.error(error);
  }
}

export async function handleRoundEnd(fastify, gameID) {
  const roundEndDateNow = Date.now();
  const gameState = await hydrateGameObject(fastify, gameID);
  if (!gameState) {
    console.error(`handleRoundEnd: missing game state for ${gameID}`);
    return;
  }
  const lastPlayedIndex =
    gameState.playedTracks[gameState.playedTracks.length - 1];
  const lastPlayedObject = gameState.tracksArray[lastPlayedIndex];
  const cleanTitle = cleanString(lastPlayedObject.title);
  const cleanArtist = cleanString(lastPlayedObject.artist);
  const playerAnswers = gameState.playerAnswers;
  const playerIDs = Object.keys(gameState.playerAnswers);
  playerIDs.map((id) => {
    const cleanPlayer = cleanString(playerAnswers[id].playerAnswer);
    let similarity;
    if (gameState.gameMode === "artist") {
      similarity = stringSimilarity.compareTwoStrings(cleanArtist, cleanPlayer);
    } else {
      similarity = stringSimilarity.compareTwoStrings(cleanTitle, cleanPlayer);
    }

    let score = 0;
    if (similarity >= 0.8) {
      const MAX_POINTS = 1000;
      const ROUND_DURATION = 30000;
      const timeDifference = roundEndDateNow - playerAnswers[id].answerDateTime;
      score = Math.floor((timeDifference / ROUND_DURATION) * MAX_POINTS);
      score = Math.max(0, Math.min(score, MAX_POINTS));
      score = (roundEndDateNow - playerAnswers[id].answerDateTime) / 100;
    }
    console.log(
      "clean player: ",
      cleanPlayer,
      "clean title: ",
      cleanTitle,
      score
    );
    const playerRecord = gameState.players[id] || { name: "Unknown" };
    gameState.playerAddScore(
      { id: id, name: playerRecord.name ?? "Unknown" },
      score
    );
  });
  await fastify.redis.set(gameID, JSON.stringify(gameState));

  fastify.io.to(gameID).emit("answers", {
    lastPlayed: lastPlayedObject,
    scores: gameState.scores,
  });
}

export async function handleGameFinish(fastify, gameID, gameState) {
  if (!gameState) {
    console.error(`handleGameFinish: missing game state for ${gameID}`);
    return;
  }
  fastify.io.to(gameID).emit("finish", { scores: gameState.scores });
  await fastify.redis.del(gameID);
}

export async function handlePlayerAnswer(
  fastify,
  gameID,
  socketID,
  playerAnswer
) {
  const gameState = await hydrateGameObject(fastify, gameID);
  if (!gameState) {
    console.error(`handlePlayerAnswer: missing game state for ${gameID}`);
    return;
  }
  gameState.addPlayerAnswer({ id: socketID }, playerAnswer, Date.now());
  console.log("player answer: ", playerAnswer, "playerID: ", socketID);
  await fastify.redis.set(gameID, JSON.stringify(gameState));

  fastify.io.to(socketID).emit("answers");
}

async function chooseRandomSong(gameState) {
  if (!gameState) {
    console.error("chooseRandomSong: missing game state reference");
    return null;
  }
  const { tracksArray, playedTracks } = gameState;

  const availableIndices = tracksArray
    .map((_, index) => index)
    .filter((index) => !playedTracks.includes(index));

  if (availableIndices.length === 0) {
    return null;
  }
  const randomIdx = randomInt(availableIndices.length);
  const chosenIndex = availableIndices[randomIdx];
  const track = tracksArray[chosenIndex];

  const previewUrl = await Deezer.getTrackPreview(tracksArray, chosenIndex);

  return {
    trackIndex: chosenIndex,
    previewUrl: previewUrl,
    trackInfo: track,
  };
}

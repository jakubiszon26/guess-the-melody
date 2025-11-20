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

export async function startGameEngine(fastify, gameID) {
  try {
    const gameState = await hydrateGameObject(fastify, gameID);
    if (!gameState) {
      console.error("hydration problem");
      return;
    }

    if (
      (gameState.gameLength === "short" && gameState.currentRound === 2) ||
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
    });
  } catch (error) {
    console.error(error);
  }
}

export async function handleRoundEnd(fastify, gameID) {
  const roundEndDateNow = Date.now();
  const gameState = await hydrateGameObject(fastify, gameID);
  const lastPlayedIndex =
    gameState.playedTracks[gameState.playedTracks.length - 1];
  const lastPlayedObject = gameState.tracksArray[lastPlayedIndex];
  const cleanTitle = cleanString(lastPlayedObject.title);
  const playerAnswers = gameState.playerAnswers;
  const playerIDs = Object.keys(gameState.playerAnswers);
  playerIDs.map((id) => {
    const cleanPlayer = cleanString(playerAnswers[id].playerAnswer);
    const similarity = stringSimilarity.compareTwoStrings(
      cleanTitle,
      cleanPlayer
    );
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
  // w przyszlosci stworzyc klase player
  gameState.addPlayerAnswer({ id: socketID }, playerAnswer, Date.now());
  console.log("player answer: ", playerAnswer, "playerID: ", socketID);
  await fastify.redis.set(gameID, JSON.stringify(gameState));

  fastify.io.to(socketID).emit("answers");
}

async function chooseRandomSong(gameState) {
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

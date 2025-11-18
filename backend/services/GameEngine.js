import { randomInt } from "crypto";
import Deezer from "./DeezerService.js";
import { GameState } from "./GameState.js";

export async function hydrateGameObject(fastify, gameID) {
  try {
    const rawData = await fastify.redis.get(gameID);
    if (!rawData) return;

    const plainObject = JSON.parse(rawData);
    const gameState = new GameState(null, {
      gameLenght: 0,
      gamePlayers: 0,
      tracksArray: [],
    });
    Object.assign(gameState, plainObject);
    return gameState;
  } catch (error) {
    console.error(error);
  }
}

export async function startGameEngine(fastify, gameID) {
  try {
    const gameState = await hydrateGameObject(fastify, gameID);
    if (!gameState) {
      console.error("hydration problem");
      return;
    }
    const nextSong = await chooseRandomSong(gameState);

    if (!nextSong) {
      console.error("no more songs");
      return;
    }

    gameState.addPlayedTrack(nextSong.trackIndex);

    gameState.currentRound++;
    await fastify.redis.set(gameID, JSON.stringify(gameState));

    fastify.io.to(gameState.hostID).emit("start_round", {
      currentRound: gameState.currentRound,
      songPreview: nextSong.previewUrl,
      trackInfo: nextSong.trackInfo,
      screenState: "guessing",
    });
    fastify.io.to(gameID).emit("player_round_start", {
      round: gameState.currentRound,
    });
  } catch (error) {
    console.error(error);
  }
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

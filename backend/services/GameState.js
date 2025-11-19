export class GameState {
  constructor(spotifyID, gameSettings) {
    this.hostID, this.gameCode;
    this.gameStarted = false;
    this.gameID = `game:${spotifyID}`;
    this.hostSpotifyID = spotifyID;
    this.gameLength = gameSettings.gameLenght;
    this.maxPlayerCount = gameSettings.gamePlayers;
    this.tracksArray = gameSettings.tracksArray;
    this.playedTracks = []; //indeksy z trackArray.
    this.players = {};
    this.playerAnswers = {};
    this.scores = {};
    this.currentRound = 0;
  }

  addPlayer(player) {
    this.players[player.id] = { name: player.name, id: player.id };
  }
  playerAddScore(player, score) {
    const playerId = player.id;
    if (!this.scores[playerId]) {
      this.scores[playerId] = {
        id: playerId,
        name: player.name,
        score: 0,
      };
    }
    this.scores[playerId].score += score;
  }

  setHostID(socketID) {
    this.hostID = socketID;
  }

  startGame() {
    this.gameStarted = true;
  }

  addPlayedTrack(trackID) {
    this.playedTracks.push(trackID);
  }

  addPlayerAnswer(player, playerAnswer, answerDateTime) {
    this.playerAnswers[player.id] = { playerAnswer, answerDateTime };
  }
}

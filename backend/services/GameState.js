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
    this.scores = {};
    this.currentRound = 0;
  }

  addPlayer(player) {
    this.players[player.id] = { name: player.name, id: player.id };
  }
  playerAddScore(player, score) {
    this.scores[player.id] += score;
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
}

export class GameState {
  constructor(spotifyID, gameSettings) {
    this.hostID, this.gameCode;
    this.gameStarted = false;
    this.gameID = `game:${spotifyID}`;
    this.hostSpotifyID = spotifyID;
    this.gameLenght = gameSettings.gameLenght;
    this.maxPlayerCount = gameSettings.gamePlayers;
    this.tracksToPlay = gameSettings.tracks;
    this.playedTracks = [];
    this.players = {};
    this.scores = {};
    this.currentRound = 1;
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

  addPlayedTrack(trackID) {
    const tracksPlayedCount = this.playedTracks.push(trackID);
    this.currentRound = tracksPlayedCount + 1;
  }
}

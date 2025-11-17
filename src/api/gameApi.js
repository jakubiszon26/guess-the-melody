import axios from "axios";

const apiurl = "http://127.0.0.1:3001/game/";

export async function requestNewGame(gameSettings) {
  try {
    const response = await axios.post(
      apiurl + "request-new-game",
      {
        gameSettings: gameSettings,
      },
      { withCredentials: true }
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getSession() {
  try {
    const response = await axios.get(apiurl + "session", {
      withCredentials: true,
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getGameCode() {
  try {
    const response = await axios.get(apiurl + "get-game-code", {
      withCredentials: true,
    });
    if (response.data.code) {
      return response.data.code;
    } else {
      throw new Error("no game code on the server");
    }
  } catch (error) {
    throw error;
  }
}

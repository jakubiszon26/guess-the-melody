import axios from "axios";
const baseurl = import.meta.env.VITE_BACKEND_URL ?? "http://127.0.0.1:3001";
const apiurl = `${baseurl}/game/`;

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

export async function discardGame() {
  try {
    const response = await axios.post(
      apiurl + "discard-game",
      {},
      {
        withCredentials: true,
      }
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Failed to discard game", error);
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

import axios from "axios";

const apiurl = "http://127.0.0.1:3001/game/";

export async function requestNewGame(gameSettings) {
  const response = await axios.post(
    apiurl + "request-new-game",
    {
      gameSettings: gameSettings,
    },
    { withCredentials: true }
  );
  console.log(response.data);
  return response.data;
}

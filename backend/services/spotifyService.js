import axios from "axios";
import "dotenv/config";
const tokenurl = process.env.SPOTIFY_TOKEN_URI;
const redirecturi = process.env.SPOTIFY_REDIRECT_URI;
const clientid = process.env.SPOTIFY_CLIENT_ID;
const clientsecret = process.env.SPOTIFY_CLIENT_SECRET;

const Spotify = {
  //fetch user profile
  //returns data
  async me(token) {
    if (!token) {
      return null;
    }
    try {
      const response = await axios.get("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching user data", error);
      throw new Error(error);
    }
  },
  async getToken(code) {
    const data = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirecturi,
    });
    const credentials = `${clientid}:${clientsecret}`;
    const encodedCredentials = Buffer.from(credentials).toString("base64");
    try {
      const response = await axios.post(tokenurl, data, {
        headers: {
          Authorization: `Basic ${encodedCredentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      const { access_token, refresh_token, expires_in } = response.data;
      return { access_token, refresh_token, expires_in };
    } catch (error) {
      throw new Error(error);
    }
  },
};

export default Spotify;

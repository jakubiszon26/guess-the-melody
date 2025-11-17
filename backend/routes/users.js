import axios from "axios";
import {
  checkIfUserExists,
  databaseUpdateTokens,
  databaseCreateUser,
  generateInternalToken,
  getSpotifyTokenFromDatabase,
} from "../services/userService.js";
import Spotify from "../services/spotifyService.js";
import "dotenv/config";
const cookieSettings = {
  path: "/",
  httpOnly: true,
  secure: true, // change to true when deployed
  sameSite: "lax",
};

async function userRoutes(fastify, options) {
  fastify.get("/get-spotify-login-url", async function (request, reply) {
    const scopes = [
      "user-read-playback-state",
      "user-modify-playback-state",
      "user-read-currently-playing",
      "streaming",
      "user-read-email",
      "user-read-private",
    ];
    const loginUrl = `${process.env.SPOTIFY_ENDPOINT}?client_id=${
      process.env.SPOTIFY_CLIENT_ID
    }&redirect_uri=${process.env.SPOTIFY_REDIRECT_URI}&scope=${scopes.join(
      "%20"
    )}&response_type=code&show_dialog=true`;

    console.log("LOGIN URL = " + loginUrl);

    reply.redirect(loginUrl);
  });
  fastify.get("/getToken", async function (request, reply) {
    try {
      console.log("Received request for /getToken");
      const code = request.query.code;
      if (!code) {
        console.log("No code received");
        return reply.status(400).send({ error: "No code provided" });
      }
      console.log("Code received:", code);
      const { access_token, refresh_token, expires_in } =
        await Spotify.getToken(code);
      const meData = await Spotify.me(access_token);
      const userID = meData.id;
      const userExist = await checkIfUserExists(userID);
      if (userExist) {
        const updatedUser = await databaseUpdateTokens(
          userID,
          access_token,
          refresh_token,
          expires_in
        );
        const internalToken = await generateInternalToken(fastify, updatedUser);
        reply.setCookie("session_token", internalToken, cookieSettings);
        return reply.redirect("http://localhost:3000/");
      } else {
        const newUSer = await databaseCreateUser(
          userID,
          access_token,
          refresh_token,
          expires_in
        );
        const internalToken = await generateInternalToken(fastify, newUSer);
        reply.setCookie("session_token", internalToken, cookieSettings);
      }
    } catch (error) {
      throw new Error(error);
    }
  });

  fastify.get(
    "/checkAuth",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      console.log("POTWIERDZONO AUTH");
      reply.send({ authenticated: true });
    }
  );

  fastify.get(
    "/fetch-user-profile",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const token = await getSpotifyTokenFromDatabase(request.user.spotifyID);
      if (token) {
        const userData = await Spotify.me(token);
        reply.send(userData);
      }
      if (!data.error) {
        reply.send(data);
      } else {
        reply.status(500).send(data.error);
      }
    }
  );
}
export default userRoutes;

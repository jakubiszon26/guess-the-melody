import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import axios from "axios";
import "dotenv/config";
const fastify = Fastify({ logger: true });
await fastify.register(fastifyCookie);
fastify.register(cors, {
  origin: "http://127.0.0.1:3000",
  credentials: true,
});

const tokenurl = "https://accounts.spotify.com/api/token";
const redirecturi = "http://127.0.0.1:3000/";
const clientid = process.env.CLIENT_ID;
const clientsecret = process.env.CLIENT_SECRET;

fastify.get("/getToken", function (request, reply) {
  console.log("Received request for /getToken");
  const code = request.query.code;
  if (code) {
    console.log("Code received:", code);
    const data = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirecturi,
    });
    const credentials = `${clientid}:${clientsecret}`;
    const encodedCredentials = Buffer.from(credentials).toString("base64");

    axios
      .post(tokenurl, data, {
        headers: {
          Authorization: `Basic ${encodedCredentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })
      .then((response) => {
        console.log("Token response:", response.data);
        const { access_token, expires_in } = response.data;
        reply.setCookie("access_token", access_token, {
          path: "/",
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: expires_in * 1000,
          domain: "127.0.0.1",
        });
        reply.send({ login: "success" });
      })
      .catch((error) => {
        console.error("Token request error:", error.response.data);
        reply.status(500).send({ error: "Failed to get token" });
      });
  } else {
    console.log("No code received");
    reply.status(400).send({ error: "No code provided" });
  }
});

fastify.get("/me", async function (request, reply) {
  const token = request.cookies.access_token;
  if (!token) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  try {
    const response = await axios.get("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    reply.send(response.data);
  } catch (error) {
    console.error("Error fetching user data", error);
    reply.status(500).send({ error: "Failed to fetch user data" });
  }
});

fastify.get("/checkAuth", async (request, reply) => {
  const token = request.cookies.access_token;
  if (token) {
    reply.send({ authenticated: true });
  } else {
    reply.send({ authenticated: false });
  }
});

fastify.listen({ port: 3001 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

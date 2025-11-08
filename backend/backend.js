import Fastify from "fastify";
import cors from "@fastify/cors";
import axios from "axios";
const fastify = Fastify({ logger: true });
fastify.register(cors, {
  origin: "http://127.0.0.1:3000",
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
        reply.send(response.data);
        console.log("Access token sent to client", response.data.access_token);
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

fastify.listen({ port: 3001 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

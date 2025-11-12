import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import fastifyJwt from "@fastify/jwt";
import "dotenv/config";
import userRoutes from "./routes/users.js";
import musicRoutes from "./routes/music.js";
import connectDB from "./config/db.js";
const fastify = Fastify({ logger: true });
await fastify.register(fastifyCookie);
fastify.register(cors, {
  origin: "http://127.0.0.1:3000",
  credentials: true,
});

connectDB();

fastify.register(userRoutes, { prefix: "/users" });
fastify.register(musicRoutes, { prefix: "/music" });
fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET,
  cookie: {
    cookieName: "session_token",
    signed: false,
  },
});

fastify.decorate("authenticate", async function (request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: "Unauthorized" });
  }
});

fastify.listen({ port: 3001 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

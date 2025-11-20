import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import fastifyJwt from "@fastify/jwt";
import "dotenv/config";
import userRoutes from "./routes/users.js";
import musicRoutes from "./routes/music.js";
import gameRoutes from "./routes/game.js";
import connectDB from "./config/db.js";
import { createClient } from "redis";
import { Server } from "socket.io";
import { setupSocketLogic } from "./services/GameSocketService.js";

const redisClient = createClient({
  url: process.env.REDIS_URI,
});
await redisClient.connect();

const fastify = Fastify({ logger: true });
await fastify.register(fastifyCookie);

fastify.register(cors, {
  origin: [process.env.ORIGIN_URL, "http://127.0.0.1:3000", "localhost:3000"],
  credentials: true,
});

const io = new Server(fastify.server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      process.env.ORIGIN_URL,
      "https://guess-the-melody-zeta.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

fastify.decorate("io", io);
fastify.decorate("redis", redisClient);
setupSocketLogic(fastify);

connectDB();

fastify.register(userRoutes, { prefix: "/users" });
fastify.register(musicRoutes, { prefix: "/music" });
fastify.register(gameRoutes, { prefix: "/game" });

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

fastify.listen(
  {
    port: Number(process.env.BACKEND_PORT) || "20992",
    host: process.env.BACKEND_HOST || "0.0.0.0",
  },
  (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  }
);

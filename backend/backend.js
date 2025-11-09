import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import "dotenv/config";
import userRoutes from "./routes/users.js";
import musicRoutes from "./routes/music.js";
const fastify = Fastify({ logger: true });
await fastify.register(fastifyCookie);
fastify.register(cors, {
  origin: "http://127.0.0.1:3000",
  credentials: true,
});

fastify.register(userRoutes, { prefix: "/users" });
fastify.register(musicRoutes, { prefix: "/music" });
fastify.listen({ port: 3001 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

import { HttpStatusCode } from "axios";
import { io } from "socket.io-client";
import { httpUrl } from "zod";

// const SOCKET_URL = import.meta.env.VITE_BACKEND_URL ?? "http://127.0.0.1:3001";

const SOCKET_URL =
  (typeof import.meta !== "undefined"
    ? import.meta.env.VITE_BACKEND_URL
    : process.env.VITE_BACKEND_URL) ?? "http://127.0.0.1:3001";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  // Temporary until the api isnt Https
  path: "/api/socket.io/",
  transports: ["polling"],
  withCredentials: true,
});

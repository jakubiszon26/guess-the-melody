import { io } from "socket.io-client";

// const SOCKET_URL = import.meta.env.VITE_BACKEND_URL ?? "http://127.0.0.1:3001";

const SOCKET_URL =
  (typeof import.meta !== "undefined"
    ? import.meta.env.VITE_BACKEND_URL
    : process.env.VITE_BACKEND_URL) ?? "http://127.0.0.1:3001";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});

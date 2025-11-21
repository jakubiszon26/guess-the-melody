import { io } from "socket.io-client";

const SOCKET_URL = "/";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  path: "/api/socket.io",
  transports: ["polling"],
  withCredentials: true,
});

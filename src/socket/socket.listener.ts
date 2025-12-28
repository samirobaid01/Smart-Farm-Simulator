import { io } from "socket.io-client";

export function startSocketListener() {
  const socket = io("http://localhost:3000", {
    transports: ["websocket"],
  });

  socket.onAny((event, data) => {
    console.log(`🔔 SOCKET [${event}]`, data);
  });

  socket.on("connect", () => {
    console.log("🟢 Socket connected", socket.id);
  });
}

import { io, Socket } from "socket.io-client";

let globalSocket: Socket | null = null;
let deviceCommandHandler: ((command: any) => void) | null = null;

/**
 * Start socket listener for receiving device commands from backend
 */
export function startSocketListener(): Socket {
  const socket = io("http://localhost:3000", {
    transports: ["websocket"],
  });

  globalSocket = socket;

  socket.onAny((event, data) => {
    console.log(`🔔 SOCKET [${event}]`, data);
  });

  socket.on("connect", () => {
    console.log("🟢 Socket connected", socket.id);
  });

  // Listen for device control commands
  socket.on("device:control", (command: any) => {
    console.log("📨 Received device control command:", command);
    if (deviceCommandHandler) {
      deviceCommandHandler(command);
    }
  });

  // Listen for device status updates
  socket.on("device:status", (command: any) => {
    console.log("📨 Received device status update:", command);
    if (deviceCommandHandler) {
      deviceCommandHandler(command);
    }
  });

  // Listen for device state changes (backend format)
  socket.on("device-state-change", (data: any) => {
    console.log("📨 Received device state change:", data);
    if (deviceCommandHandler) {
      deviceCommandHandler(data);
    }
  });

  // Generic command handler (backend might send different event names)
  socket.on("command", (command: any) => {
    console.log("📨 Received command:", command);
    if (deviceCommandHandler) {
      deviceCommandHandler(command);
    }
  });

  return socket;
}

/**
 * Set handler for device commands
 */
export function setDeviceCommandHandler(handler: (command: any) => void): void {
  deviceCommandHandler = handler;
}

/**
 * Get the socket instance
 */
export function getSocket(): Socket | null {
  return globalSocket;
}

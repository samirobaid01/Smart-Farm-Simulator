import { io, Socket } from "socket.io-client";
import { DeviceStateChangeEvent } from "../types/data.js";

let globalSocket: Socket | null = null;
let deviceStateChangeHandler: ((event: DeviceStateChangeEvent) => void) | null = null;

/**
 * Start socket listener for receiving device commands from backend
 */
export function startSocketListener(
  onDeviceStateChange?: (event: DeviceStateChangeEvent) => void
): Socket {
  const socket = io("http://localhost:3000", {
    transports: ["websocket"],
  });

  globalSocket = socket;

  if (onDeviceStateChange) {
    deviceStateChangeHandler = onDeviceStateChange;
  }

  const processDeviceStateChange = (data: any) => {
    if (!deviceStateChangeHandler || !data) {
      return;
    }

    try {
      const eventData = typeof data === 'string' ? JSON.parse(data) : data;
      
      const deviceUuid = eventData?.deviceUuid || eventData?.metadata?.deviceUuid;
      const stateName = eventData?.metadata?.stateName;
      const newValue = eventData?.metadata?.newValue;

      if (deviceUuid && stateName && newValue !== undefined && newValue !== null) {
        deviceStateChangeHandler(eventData as DeviceStateChangeEvent);
      } else {
        console.warn(`⚠️  Socket event missing required fields:`, {
          hasDeviceUuid: !!deviceUuid,
          hasStateName: !!stateName,
          hasNewValue: newValue !== undefined && newValue !== null
        });
      }
    } catch (error) {
      console.warn(`⚠️  Failed to process socket event:`, error);
    }
  };

  socket.on("device-state-change", (data) => {
    console.log(`🔔 SOCKET [device-state-change]`, data);
    processDeviceStateChange(data);
  });

  socket.onAny((event, data) => {
    if (event !== "device-state-change") {
      console.log(`🔔 SOCKET [${event}]`, data);
      processDeviceStateChange(data);
    }
  });

  socket.on("connect", () => {
    console.log("🟢 Socket connected", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔴 Socket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Socket connection error:", error.message);
  });

  return socket;
}

/**
 * Set handler for device state changes
 */
export function setDeviceStateChangeHandler(handler: (event: DeviceStateChangeEvent) => void): void {
  deviceStateChangeHandler = handler;
}

/**
 * Get the socket instance
 */
export function getSocket(): Socket | null {
  return globalSocket;
}

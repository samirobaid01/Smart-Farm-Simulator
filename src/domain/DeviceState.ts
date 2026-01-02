/**
 * Pure state representation of a device
 * Type is string (not enum) to support future JSON/DB-driven models
 */
export interface DeviceState {
  deviceUuid: string;
  type: string; // NOT enum (future JSON / DB)
  status: "ON" | "OFF";
  level?: number; // Optional intensity/level for devices that support it
}



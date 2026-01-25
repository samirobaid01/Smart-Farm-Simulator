import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Device, DeviceState, DeviceWithStates } from "../types/data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface DevicesConfig {
  devices: DeviceWithStates[];
}

/**
 * Device Repository - Manages device data matching backend schema
 * Matches: aemos_core.Device + aemos_core.DeviceState
 */
export class DeviceRepository {
  private devices: Map<number, DeviceWithStates> = new Map();
  private devicesByUuid: Map<string, DeviceWithStates> = new Map();

  /**
   * Load devices from JSON file
   */
  loadFromFile(filePath?: string): void {
    const path = filePath || join(__dirname, "../config/devices.json");
    try {
      const content = readFileSync(path, "utf-8");
      const config: DevicesConfig = JSON.parse(content);

      this.devices.clear();
      this.devicesByUuid.clear();

      for (const device of config.devices) {
        this.devices.set(device.id, device);
        if (device.uuid) {
          this.devicesByUuid.set(device.uuid, device);
        }
      }

      console.log(`✅ Loaded ${this.devices.size} devices from ${path}`);
    } catch (error) {
      console.error(`❌ Failed to load devices from ${path}:`, error);
      throw error;
    }
  }

  /**
   * Get device by ID
   */
  getDeviceById(deviceId: number): DeviceWithStates | undefined {
    return this.devices.get(deviceId);
  }

  /**
   * Get device by UUID
   */
  getDeviceByUuid(deviceUuid: string): DeviceWithStates | undefined {
    return this.devicesByUuid.get(deviceUuid);
  }

  /**
   * Get all devices
   */
  getAllDevices(): DeviceWithStates[] {
    return Array.from(this.devices.values());
  }

  /**
   * Get all device states for a device
   */
  getDeviceStates(deviceUuid: string): DeviceState[] {
    const device = this.devicesByUuid.get(deviceUuid);
    return device?.deviceStates || [];
  }

  /**
   * Get specific device state
   */
  getDeviceState(deviceUuid: string, stateName: string): DeviceState | undefined {
    const device = this.devicesByUuid.get(deviceUuid);
    return device?.deviceStates.find((ds) => ds.stateName === stateName);
  }

  /**
   * Check if device exists
   */
  hasDevice(deviceUuid: string): boolean {
    return this.devicesByUuid.has(deviceUuid);
  }

  /**
   * Validate state value against allowed values
   */
  validateStateValue(deviceUuid: string, stateName: string, value: string): boolean {
    const deviceState = this.getDeviceState(deviceUuid, stateName);
    if (!deviceState) return false;

    const allowedValues = deviceState.allowedValues;

    // Handle different allowedValues formats
    if (Array.isArray(allowedValues)) {
      return allowedValues.includes(value) || allowedValues.map(String).includes(value);
    }

    if (typeof allowedValues === "string") {
      // If string like "number", check if value is a valid number
      if (allowedValues === "number") {
        return !isNaN(Number(value));
      }
      // If string like "16-30", parse as range
      if (allowedValues.includes("-")) {
        const [min, max] = allowedValues.split("-").map(Number);
        const numValue = Number(value);
        return !isNaN(numValue) && numValue >= min && numValue <= max;
      }
    }

    // Default: accept any value if allowedValues is not properly defined
    return true;
  }
}


import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { RuntimeDeviceState, DeviceStateInstance } from "../types/data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface DeviceStatesConfig {
  devices: Record<string, RuntimeDeviceState>;
}

/**
 * Device State Store - Manages runtime device states
 * Matches: aemos_core.DeviceStateInstance (simplified for JSON)
 * Persists device states for reuse by other modules
 */
export class DeviceStateStore {
  private stateFile: string;
  private deviceStates: Map<string, RuntimeDeviceState> = new Map();

  constructor(stateFilePath?: string) {
    this.stateFile = stateFilePath || join(__dirname, "../data/device-states.json");
  }

  /**
   * Load device states from JSON file
   */
  loadFromFile(filePath?: string): void {
    const path = filePath || this.stateFile;
    
    if (!existsSync(path)) {
      console.log(`📝 Device states file not found, creating new: ${path}`);
      this.deviceStates.clear();
      this.saveToFile(path);
      return;
    }

    try {
      const content = readFileSync(path, "utf-8");
      const config: DeviceStatesConfig = JSON.parse(content);

      this.deviceStates.clear();
      for (const [uuid, state] of Object.entries(config.devices)) {
        this.deviceStates.set(uuid, state);
      }

      console.log(`✅ Loaded ${this.deviceStates.size} device states from ${path}`);
    } catch (error) {
      console.error(`❌ Failed to load device states from ${path}:`, error);
      // Initialize empty if file is corrupted
      this.deviceStates.clear();
    }
  }

  /**
   * Save device states to JSON file
   */
  saveToFile(filePath?: string): void {
    const path = filePath || this.stateFile;
    
    try {
      const config: DeviceStatesConfig = {
        devices: Object.fromEntries(this.deviceStates),
      };

      writeFileSync(path, JSON.stringify(config, null, 2), "utf-8");
    } catch (error) {
      console.error(`❌ Failed to save device states to ${path}:`, error);
      throw error;
    }
  }

  /**
   * Update device state
   */
  updateDeviceState(
    deviceUuid: string,
    deviceId: number,
    deviceName: string,
    deviceType: string,
    stateName: string,
    value: string
  ): void {
    let deviceState = this.deviceStates.get(deviceUuid);

    if (!deviceState) {
      // Create new device state entry
      deviceState = {
        deviceId,
        deviceUuid,
        deviceName,
        deviceType,
        states: {},
        lastUpdated: new Date().toISOString(),
      };
      this.deviceStates.set(deviceUuid, deviceState);
    }

    // Update state value
    deviceState.states[stateName] = value;
    deviceState.lastUpdated = new Date().toISOString();

    // Save to file
    this.saveToFile();
  }

  /**
   * Get device state value
   */
  getDeviceState(deviceUuid: string, stateName?: string): any {
    const deviceState = this.deviceStates.get(deviceUuid);
    if (!deviceState) return undefined;

    if (stateName) {
      return deviceState.states[stateName];
    }

    return deviceState.states;
  }

  /**
   * Get all states for a device
   */
  getDeviceStates(deviceUuid: string): Record<string, string> | undefined {
    const deviceState = this.deviceStates.get(deviceUuid);
    return deviceState?.states;
  }

  /**
   * Get all device states
   */
  getAllDeviceStates(): Map<string, RuntimeDeviceState> {
    return new Map(this.deviceStates);
  }

  /**
   * Get device state object
   */
  getDeviceStateObject(deviceUuid: string): RuntimeDeviceState | undefined {
    return this.deviceStates.get(deviceUuid);
  }

  /**
   * Check if device state exists
   */
  hasDeviceState(deviceUuid: string): boolean {
    return this.deviceStates.has(deviceUuid);
  }
}


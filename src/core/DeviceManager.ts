import { DeviceState } from "../domain/DeviceState.js";

/**
 * Device Manager - Manages device states and updates from backend commands
 */
export class DeviceManager {
  private devices: Map<string, DeviceState> = new Map();

  /**
   * Initialize devices from a list
   */
  initialize(deviceList: Array<{ id: string; type: string }>): void {
    for (const device of deviceList) {
      this.devices.set(device.id, {
        deviceUuid: device.id,
        type: device.type,
        status: "OFF",
        level: 0,
      });
    }
  }

  /**
   * Update device state from backend command
   * Supports multiple formats:
   * 1. Simple: { deviceId: string, status: "ON" | "OFF", level?: number }
   * 2. Backend format: { deviceUuid: string, metadata: { stateName: string, newValue: string } }
   */
  updateDevice(command: any): boolean {
    let deviceId: string | undefined;
    let status: "ON" | "OFF" | undefined;
    let level: number | undefined;
    let deviceType: string | undefined;

    // Handle backend device-state-change format
    if (command.metadata) {
      // Backend format: { deviceUuid, metadata: { stateName, newValue } }
      deviceId = command.deviceUuid || command.metadata.deviceUuid;
      const stateName = command.metadata.stateName;
      const newValue = command.metadata.newValue?.toLowerCase();

      // Map state values to ON/OFF
      if (newValue === "on" || newValue === "true" || newValue === "1") {
        status = "ON";
      } else if (newValue === "off" || newValue === "false" || newValue === "0") {
        status = "OFF";
      }

      // Extract device type from command if available
      deviceType = command.deviceType || command.metadata.deviceType;
      
      // Infer device type from device name if not provided
      if (!deviceType && command.metadata?.deviceName) {
        deviceType = this.inferDeviceTypeFromName(command.metadata.deviceName);
      }

      // Try to find device by UUID if not found by ID
      if (deviceId && !this.devices.has(deviceId)) {
        // Search by UUID in existing devices
        const existingDevice = Array.from(this.devices.values()).find(
          (d) => d.deviceUuid === deviceId
        );
        if (existingDevice) {
          deviceId = existingDevice.deviceUuid;
        } else {
          // Device not initialized - create it dynamically
          console.log(`📝 Creating new device dynamically: ${deviceId} (${deviceType || "UNKNOWN"})`);
          this.devices.set(deviceId, {
            deviceUuid: deviceId,
            type: deviceType || "UNKNOWN",
            status: status || "OFF",
            level: 0,
          });
        }
      }
    } else {
      // Simple format: { deviceId, status, level }
      deviceId = command.deviceId || command.deviceUuid;
      status = command.status;
      level = command.level;
      deviceType = command.type;
    }

    if (!deviceId) {
      console.warn("Device command missing deviceId/deviceUuid");
      return false;
    }

    const device = this.devices.get(deviceId);
    if (!device) {
      console.warn(`Device not found: ${deviceId}. Available devices: ${Array.from(this.devices.keys()).join(", ")}`);
      return false;
    }

    if (status !== undefined) {
      device.status = status;
    }

    if (level !== undefined) {
      device.level = level;
    }

    if (deviceType) {
      device.type = deviceType;
    }

    console.log(`✅ Device updated: ${deviceId} (${device.type}) → ${device.status}${device.level ? ` (level: ${device.level})` : ""}`);
    return true;
  }

  /**
   * Get all device states
   */
  getAllDevices(): DeviceState[] {
    return Array.from(this.devices.values());
  }

  /**
   * Get device by ID
   */
  getDevice(deviceId: string): DeviceState | undefined {
    return this.devices.get(deviceId);
  }

  /**
   * Get devices by type
   */
  getDevicesByType(type: string): DeviceState[] {
    return Array.from(this.devices.values()).filter((d) => d.type === type);
  }

  /**
   * Infer device type from device name
   */
  private inferDeviceTypeFromName(deviceName: string): string {
    const name = deviceName.toLowerCase();
    
    if (name.includes("pump") || name.includes("water pump")) {
      return "WATER_PUMP";
    }
    if (name.includes("fan")) {
      return "FAN";
    }
    if (name.includes("ac") || name.includes("air conditioner") || name.includes("air conditioning")) {
      return "AC";
    }
    if (name.includes("heater")) {
      return "HEATER";
    }
    if (name.includes("humidifier")) {
      return "HUMIDIFIER";
    }
    if (name.includes("light") || name.includes("grow light")) {
      return "GROW_LIGHT";
    }
    
    return "UNKNOWN";
  }
}


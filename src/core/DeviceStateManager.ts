import { DeviceRepository } from "../data/DeviceRepository.js";
import { DeviceStateStore } from "../data/DeviceStateStore.js";
import { DeviceStateChangeEvent } from "../types/data.js";

/**
 * Device State Manager - Processes device state change events from backend
 * Validates and updates device states based on backend schema
 */
export class DeviceStateManager {
  constructor(
    private deviceRepo: DeviceRepository,
    private stateStore: DeviceStateStore
  ) {}

  /**
   * Process device state change event from socket
   * Matches backend DeviceStateChangeEvent format
   */
  processStateChange(event: DeviceStateChangeEvent): void {
    const deviceUuid = event.deviceUuid || event.metadata?.deviceUuid;
    const stateName = event.metadata?.stateName;
    const newValue = event.metadata?.newValue;

    if (!deviceUuid) {
      console.warn("⚠️  Device state change event missing deviceUuid");
      return;
    }

    if (!stateName) {
      console.warn(`⚠️  Device state change event missing stateName for device ${deviceUuid}`);
      return;
    }

    if (newValue === undefined || newValue === null) {
      console.warn(`⚠️  Device state change event missing newValue for device ${deviceUuid}, state ${stateName}`);
      return;
    }

    // Check if device exists in repository
    const device = this.deviceRepo.getDeviceByUuid(deviceUuid);
    if (!device) {
      console.warn(`⚠️  Device not found in repository: ${deviceUuid}`);
      // Optionally create device dynamically if needed
      return;
    }

    // Check if state exists for device
    const deviceState = this.deviceRepo.getDeviceState(deviceUuid, stateName);
    if (!deviceState) {
      console.warn(`⚠️  State ${stateName} not found for device ${deviceUuid}`);
      return;
    }

    // Validate new value against allowed values
    const stringValue = String(newValue);
    if (!this.deviceRepo.validateStateValue(deviceUuid, stateName, stringValue)) {
      console.warn(
        `⚠️  Invalid value ${stringValue} for device ${deviceUuid}, state ${stateName}. Allowed: ${JSON.stringify(deviceState.allowedValues)}`
      );
      return;
    }

    // Update device state
    this.stateStore.updateDeviceState(
      deviceUuid,
      device.id,
      device.name || "Unknown Device",
      device.deviceType,
      stateName,
      stringValue
    );

    console.log(
      `✅ Device state updated: ${device.name} (${deviceUuid}) → ${stateName} = ${stringValue}`
    );
  }

  /**
   * Get current device state
   */
  getDeviceState(deviceUuid: string, stateName?: string): any {
    return this.stateStore.getDeviceState(deviceUuid, stateName);
  }

  /**
   * Get all states for a device
   */
  getDeviceStates(deviceUuid: string): Record<string, string> | undefined {
    return this.stateStore.getDeviceStates(deviceUuid);
  }

  /**
   * Get all device states (for other modules)
   */
  getAllDeviceStates() {
    return this.stateStore.getAllDeviceStates();
  }
}


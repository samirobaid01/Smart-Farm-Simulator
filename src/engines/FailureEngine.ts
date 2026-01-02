import { EnvironmentState } from "../domain/EnvironmentState.js";
import { DeviceState } from "../domain/DeviceState.js";

/**
 * Failure Engine - Injects probabilistic failures for resilience testing
 * Open-closed: Can be extended with new failure types
 */
export class FailureEngine {
  private failureProbability: number;

  constructor(failureProbability: number = 0.01) {
    this.failureProbability = failureProbability;
  }

  /**
   * Inject random failures into environment (disease, sensor faults, stress)
   */
  inject(env: EnvironmentState): void {
    if (Math.random() < this.failureProbability) {
      const failureType = Math.floor(Math.random() * 3);

      switch (failureType) {
        case 0:
          // Disease/stress - affects soil moisture
          env.soilMoisture = Math.max(0, env.soilMoisture - 10);
          console.warn("⚠️  Failure injected: Disease/stress detected - soil moisture decreased");
          break;

        case 1:
          // Sensor fault - temperature reading spike
          env.temperature += 5;
          console.warn("⚠️  Failure injected: Sensor fault - temperature reading spike");
          break;

        case 2:
          // Environmental stress - humidity drop
          env.humidity = Math.max(0, env.humidity - 15);
          console.warn("⚠️  Failure injected: Environmental stress - humidity dropped");
          break;
      }
    }
  }

  /**
   * Inject device failures (device stops working)
   */
  injectDeviceFailure(devices: DeviceState[]): void {
    if (Math.random() < this.failureProbability * 0.5) {
      const device = devices[Math.floor(Math.random() * devices.length)];
      if (device && device.status === "ON") {
        device.status = "OFF";
        console.warn(`⚠️  Device failure: ${device.type} (${device.deviceUuid}) stopped working`);
      }
    }
  }
}



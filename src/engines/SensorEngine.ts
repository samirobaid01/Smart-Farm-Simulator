import { EnvironmentState } from "../domain/EnvironmentState.js";

/**
 * Sensor Engine - Reads sensor values from environment
 * Maps environment state to sensor readings
 */
export class SensorEngine {
  /**
   * Read sensor values from the current environment state
   * Returns a snapshot of the environment as sensor readings
   */
  read(env: EnvironmentState): Partial<EnvironmentState> {
    return {
      temperature: this.round(env.temperature, 2),
      humidity: this.round(env.humidity, 2),
      soilMoisture: this.round(env.soilMoisture, 2),
      lightLux: this.round(env.lightLux, 0),
      oxygenPPM: this.round(env.oxygenPPM, 2),
      pH: this.round(env.pH, 2),
    };
  }

  /**
   * Read a specific sensor value
   */
  readSensor(env: EnvironmentState, sensorType: keyof EnvironmentState): number {
    return this.round(env[sensorType], 2);
  }

  private round(value: number, decimals: number): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
}


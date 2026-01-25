import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Sensor, TelemetryData, SensorWithTelemetryData } from "../types/data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SensorsConfig {
  sensors: SensorWithTelemetryData[];
}

/**
 * Sensor Repository - Manages sensor data matching backend schema
 * Matches: aemos_core.Sensor + aemos_core.TelemetryData
 */
export class SensorRepository {
  private sensors: Map<number, SensorWithTelemetryData> = new Map();

  /**
   * Load sensors from JSON file
   */
  loadFromFile(filePath?: string): void {
    const path = filePath || join(__dirname, "../config/sensors.json");
    try {
      const content = readFileSync(path, "utf-8");
      const config: SensorsConfig = JSON.parse(content);

      this.sensors.clear();
      for (const sensor of config.sensors) {
        this.sensors.set(sensor.id, sensor);
      }

      console.log(`✅ Loaded ${this.sensors.size} sensors from ${path}`);
    } catch (error) {
      console.error(`❌ Failed to load sensors from ${path}:`, error);
      throw error;
    }
  }

  /**
   * Get sensor by ID
   */
  getSensor(sensorId: number): SensorWithTelemetryData | undefined {
    return this.sensors.get(sensorId);
  }

  /**
   * Get all sensors
   */
  getAllSensors(): SensorWithTelemetryData[] {
    return Array.from(this.sensors.values());
  }

  /**
   * Get all telemetry data for a sensor
   */
  getSensorTelemetryData(sensorId: number): TelemetryData[] {
    const sensor = this.sensors.get(sensorId);
    return sensor?.telemetryData || [];
  }

  /**
   * Get specific telemetry data by variable name
   */
  getTelemetryDataByVariableName(sensorId: number, variableName: string): TelemetryData | undefined {
    const sensor = this.sensors.get(sensorId);
    return sensor?.telemetryData.find((td) => td.variableName === variableName);
  }

  /**
   * Check if sensor exists
   */
  hasSensor(sensorId: number): boolean {
    return this.sensors.has(sensorId);
  }
}


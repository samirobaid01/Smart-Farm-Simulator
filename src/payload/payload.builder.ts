import { TelemetryPayload, BatchTelemetryPayload } from "../types.js";
import { SensorRepository } from "../data/SensorRepository.js";
import { TelemetryData } from "../types/data.js";

/**
 * Payload Builder - Generates telemetry payloads from sensor configuration
 * Data-driven: No hardcoded values, all from SensorRepository
 */
export class PayloadBuilder {
  constructor(private sensorRepo: SensorRepository) {}

  /**
   * Build single telemetry payload for a sensor variable
   * @param sensorId - Sensor ID
   * @param variableName - Optional variable name (random if not specified)
   * @returns TelemetryPayload
   */
  buildTelemetryPayload(sensorId: number, variableName?: string): TelemetryPayload {
    const telemetryDataList = this.sensorRepo.getSensorTelemetryData(sensorId);

    if (telemetryDataList.length === 0) {
      throw new Error(`No telemetry data found for sensor ${sensorId}`);
    }

    let telemetryData: TelemetryData;

    if (variableName) {
      // Get specific variable
      telemetryData = this.sensorRepo.getTelemetryDataByVariableName(sensorId, variableName)!;
      if (!telemetryData) {
        throw new Error(`Variable ${variableName} not found for sensor ${sensorId}`);
      }
    } else {
      // Randomly select a variable
      const randomIndex = Math.floor(Math.random() * telemetryDataList.length);
      telemetryData = telemetryDataList[randomIndex];
    }

    return {
      variableName: telemetryData.variableName || "Unknown",
      value: this.generateValue(telemetryData),
      recievedAt: new Date().toISOString(),
    };
  }

  /**
   * Build all telemetry payloads for a sensor (one for each variable)
   * @param sensorId - Sensor ID
   * @returns Array of TelemetryPayload
   */
  buildAllTelemetryPayloads(sensorId: number): TelemetryPayload[] {
    const telemetryDataList = this.sensorRepo.getSensorTelemetryData(sensorId);

    if (telemetryDataList.length === 0) {
      throw new Error(`No telemetry data found for sensor ${sensorId}`);
    }

    return telemetryDataList.map((telemetryData) => ({
      variableName: telemetryData.variableName || "Unknown",
      value: this.generateValue(telemetryData),
      recievedAt: new Date().toISOString(),
    }));
  }

  /**
   * Build batch telemetry payload for multiple sensors
   * @param sensorIds - Array of sensor IDs
   * @returns BatchTelemetryPayload
   */
  buildBatchPayload(sensorIds: number[]): BatchTelemetryPayload {
    const dataStreams: TelemetryPayload[] = [];

    for (const sensorId of sensorIds) {
      try {
        const payloads = this.buildAllTelemetryPayloads(sensorId);
        dataStreams.push(...payloads);
      } catch (error) {
        console.error(`Failed to build payload for sensor ${sensorId}:`, error);
      }
    }

    return { dataStreams };
  }

  /**
   * Generate random value based on telemetry data configuration
   * Data-driven: Uses datatype, minRange, maxRange from config
   */
  private generateValue(telemetryData: TelemetryData): string {
    const datatype = telemetryData.datatype?.toLowerCase() || "float";
    const minRange = telemetryData.minRange ?? 0;
    const maxRange = telemetryData.maxRange ?? 100;

    const randomValue = Math.random() * (maxRange - minRange) + minRange;

    switch (datatype) {
      case "integer":
      case "int":
        return Math.round(randomValue).toString();

      case "percentage":
        const percentage = Math.round(Math.max(0, Math.min(100, randomValue)));
        return percentage.toString();

      case "float":
      case "double":
      case "decimal":
      default:
        return randomValue.toFixed(2);
    }
  }
}

// Legacy function exports for backward compatibility
let defaultPayloadBuilder: PayloadBuilder | null = null;

export function setDefaultPayloadBuilder(builder: PayloadBuilder): void {
  defaultPayloadBuilder = builder;
}

export function buildTelemetryPayload(sensorId?: number): TelemetryPayload {
  if (!defaultPayloadBuilder) {
    throw new Error("PayloadBuilder not initialized. Call setDefaultPayloadBuilder first.");
  }
  if (!sensorId) {
    throw new Error("sensorId is required");
  }
  return defaultPayloadBuilder.buildTelemetryPayload(sensorId);
}

export function buildBatchPayload(sensorIds?: number[]): BatchTelemetryPayload {
  if (!defaultPayloadBuilder) {
    throw new Error("PayloadBuilder not initialized. Call setDefaultPayloadBuilder first.");
  }
  if (!sensorIds || sensorIds.length === 0) {
    throw new Error("sensorIds array is required");
  }
  return defaultPayloadBuilder.buildBatchPayload(sensorIds);
}

import { TelemetryPayload, BatchTelemetryPayload } from "../types.js";
import { config } from "../config/config.js";

/**
 * Generate random value within a range
 */
function generateRandomValue(minRange: number, maxRange: number, datatype: string): string {
  const value = Math.random() * (maxRange - minRange) + minRange;
  
  if (datatype === "percentage" || datatype === "integer") {
    return Math.round(value).toString();
  }
  
  return value.toFixed(2);
}

/**
 * Build single telemetry payload
 * @param sensorId - The sensor ID to lookup in config
 * @param telemetryDataIndex - Optional index to select specific telemetry data (defaults to random)
 * @returns {TelemetryPayload}
 */
export function buildTelemetryPayload(sensorId: number, telemetryDataIndex?: number): TelemetryPayload {
  const sensor = config.SensorDevices.find(s => s.sensorId === sensorId);
  
  if (!sensor) {
    throw new Error(`Sensor with ID ${sensorId} not found in config`);
  }
  
  if (!sensor.TelemetryData || sensor.TelemetryData.length === 0) {
    throw new Error(`Sensor ${sensorId} has no TelemetryData configured`);
  }
  
  // Select telemetry data entry (random if index not provided)
  const index = telemetryDataIndex !== undefined 
    ? telemetryDataIndex 
    : Math.floor(Math.random() * sensor.TelemetryData.length);
  
  const telemetryData = sensor.TelemetryData[index];
  
  if (!telemetryData) {
    throw new Error(`TelemetryData index ${index} not found for sensor ${sensorId}`);
  }
  
  return {
    variableName: telemetryData.variableName,
    value: generateRandomValue(telemetryData.minRange, telemetryData.maxRange, telemetryData.datatype),
    recievedAt: new Date().toISOString(),
  };
}

/**
 * Get all telemetry payloads for a sensor (one for each TelemetryData entry)
 * @param sensorId - The sensor ID to lookup in config
 * @returns {TelemetryPayload[]} Array of telemetry payloads, one for each variable
 */
export function buildAllTelemetryPayloads(sensorId: number): TelemetryPayload[] {
  const sensor = config.SensorDevices.find(s => s.sensorId === sensorId);
  
  if (!sensor) {
    throw new Error(`Sensor with ID ${sensorId} not found in config`);
  }
  
  if (!sensor.TelemetryData || sensor.TelemetryData.length === 0) {
    throw new Error(`Sensor ${sensorId} has no TelemetryData configured`);
  }
  
  return sensor.TelemetryData.map(telemetryData => ({
    variableName: telemetryData.variableName,
    value: generateRandomValue(telemetryData.minRange, telemetryData.maxRange, telemetryData.datatype),
    recievedAt: new Date().toISOString(),
  }));
}

/**
 * Build batch telemetry payload
 * @param sensorId - The sensor ID to lookup in config
 * @returns {BatchTelemetryPayload}
 */
export function buildBatchPayload(sensorId: number): BatchTelemetryPayload {
  const dataStreams = buildAllTelemetryPayloads(sensorId);
  
  return {
    dataStreams,
  };
}

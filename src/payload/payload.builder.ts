import { TelemetryPayload, BatchTelemetryPayload } from "../types.js";

/**
 * Build single telemetry payload
 * @returns {TelemetryPayload}
 */
export function buildTelemetryPayload() {
  return {
    variableName: 'pH Level',
    value: (Math.random() * 5 + 5).toFixed(2),
    recievedAt: new Date().toISOString(),
  };
}

/**
 * Build batch telemetry payload
 * @returns {BatchTelemetryPayload}
 */
export function buildBatchPayload() {
  return {
    dataStreams: [
      {
        variableName: 'pH Level',
        value: (Math.random() * 10 + 20).toFixed(2),
        recievedAt: new Date().toISOString(),
      },
      {
        variableName: 'pH Level',
        value: (Math.random() * 10 + 20).toFixed(2),
        recievedAt: new Date().toISOString(),
      },
      {
        variableName: 'pH Level',
        value: (Math.random() * 10 + 20).toFixed(2),
        recievedAt: new Date().toISOString(),
      },
    ],
  };
}

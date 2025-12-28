import { TelemetryPayload, BatchTelemetryPayload } from "../types.js";

/**
 * Build single telemetry payload
 * @returns {TelemetryPayload}
 */
export function buildTelemetryPayload() {
  return {
    telemetryDataId: 1,
    value: (Math.random() * 10 + 20).toFixed(2),
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
        telemetryDataId: 1,
        value: (Math.random() * 10 + 20).toFixed(2),
        recievedAt: new Date().toISOString(),
      },
      {
        telemetryDataId: 1,
        value: (Math.random() * 10 + 20).toFixed(2),
        recievedAt: new Date().toISOString(),
      },
      {
        telemetryDataId: 1,
        value: (Math.random() * 10 + 20).toFixed(2),
        recievedAt: new Date().toISOString(),
      },
    ],
  };
}

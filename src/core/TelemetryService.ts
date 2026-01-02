import { buildAllTelemetryPayloads, buildBatchPayload } from "../payload/payload.builder.js";
import { TelemetrySender, DeviceContext } from "../types.js";

export class TelemetryService {
  constructor(
    private sender: TelemetrySender,
    private deviceSensorMap: Map<string, number>
  ) {}

  async execute(devicesContext: DeviceContext[]): Promise<void> {
    for (const deviceContext of devicesContext) {
      const sensorId = this.deviceSensorMap.get(deviceContext.deviceUuid);
      if (!sensorId) {
        console.error(`No sensorId found for device: ${deviceContext.deviceUuid}`);
        continue;
      }
      console.log("Executing telemetry for device:", deviceContext.deviceUuid);
      
      // Get all telemetry payloads for this sensor (one for each variable)
      const telemetryPayloads = buildAllTelemetryPayloads(sensorId);
      
      // Send each telemetry variable separately
      for (const payload of telemetryPayloads) {
        console.log(`Sending ${payload.variableName} for sensor ${sensorId}`);
        await this.sender.send(deviceContext, payload);
      }
    }
  }

  async executeBatch(devices: DeviceContext[]): Promise<void> {
    if (!this.sender.sendBatch) return;

    for (const device of devices) {
      const sensorId = this.deviceSensorMap.get(device.deviceUuid);
      if (!sensorId) {
        console.error(`No sensorId found for device: ${device.deviceUuid}`);
        continue;
      }
      await this.sender.sendBatch(device, sensorId);
    }
  }

  /**
   * Send a single telemetry payload
   * Used by simulation adapters
   */
  async sendPayload(deviceContext: DeviceContext, payload: import("../types.js").TelemetryPayload): Promise<void> {
    await this.sender.send(deviceContext, payload);
  }
}

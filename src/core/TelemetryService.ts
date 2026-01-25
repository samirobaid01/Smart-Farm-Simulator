import { PayloadBuilder } from "../payload/payload.builder.js";
import { TelemetrySender, DeviceContext } from "../types.js";

export class TelemetryService {
  constructor(
    private sender: TelemetrySender,
    private payloadBuilder: PayloadBuilder,
    private deviceSensorMap: Map<string, number> // Maps deviceUuid to sensorId
  ) {}

  async execute(devicesContext: DeviceContext[]): Promise<void> {
    for (const deviceContext of devicesContext) {
      const sensorId = this.deviceSensorMap.get(deviceContext.deviceUuid);
      if (!sensorId) {
        console.error(`No sensorId found for device: ${deviceContext.deviceUuid}`);
        continue;
      }

      console.log(`📡 Sending telemetry for sensor ${sensorId} (device: ${deviceContext.deviceUuid})`);

      // Get all telemetry payloads for this sensor (one for each variable)
      const telemetryPayloads = this.payloadBuilder.buildAllTelemetryPayloads(sensorId);

      // Send each telemetry variable separately
      for (const payload of telemetryPayloads) {
        console.log(`  → ${payload.variableName} = ${payload.value}`);
        await this.sender.send(deviceContext, payload);
      }
      console.log("-------------COMPLETED-------------------");
    }
  }

  async executeBatch(devices: DeviceContext[]): Promise<void> {
    if (!this.sender.sendBatch) return;

    const sensorIds = devices
      .map((d) => this.deviceSensorMap.get(d.deviceUuid))
      .filter((id): id is number => id !== undefined);

    if (sensorIds.length === 0) {
      console.error("No valid sensor IDs found for batch");
      return;
    }

    const batchPayload = this.payloadBuilder.buildBatchPayload(sensorIds);

    // Send batch for first device (assuming all devices share same context)
    if (devices.length > 0) {
      await this.sender.sendBatch(devices[0], batchPayload);
    }
  }
}

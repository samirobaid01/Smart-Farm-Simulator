import { buildTelemetryPayload } from "../payload/payload.builder.js";
import { TelemetrySender, DeviceContext } from "../types.js";

export class TelemetryService {
  constructor(private sender: TelemetrySender) {}

  async execute(devicesContext: DeviceContext[]): Promise<void> {
    for (const deviceContext of devicesContext) {
      console.log("Executing telemetry for device:", deviceContext.deviceUuid);
      await this.sender.send(deviceContext, buildTelemetryPayload());
    }
  }

  async executeBatch(devices: DeviceContext[]): Promise<void> {
    if (!this.sender.sendBatch) return;

    for (const device of devices) {
      await this.sender.sendBatch(device);
    }
  }
}

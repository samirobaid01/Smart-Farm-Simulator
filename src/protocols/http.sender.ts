import axios from "axios";
import { DeviceContext, TelemetrySender, TelemetryPayload, BatchTelemetryPayload } from "../types.js";
import { buildBatchPayload } from "../payload/payload.builder.js";
import { config } from "../config/config.js";

export class HttpSender implements TelemetrySender {
  async send(ctx: DeviceContext, telemetryPayload: TelemetryPayload): Promise<void> {
    console.log("Sending telemetry payload:", telemetryPayload);

    await axios.post(`${config.baseUrl}/datastreams/token`, telemetryPayload, {
      headers: {
        Authorization: `Bearer ${ctx.deviceToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  async sendBatch(ctx: DeviceContext, sensorId: number): Promise<void> {
    const payload = buildBatchPayload(sensorId);

    await axios.post(`${config.baseUrl}/datastreams/batch`, payload, {
      headers: {
        Authorization: `Bearer ${ctx.deviceToken}`,
        "Content-Type": "application/json",
      },
    });
  }
}

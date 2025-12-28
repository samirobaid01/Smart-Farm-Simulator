import axios from "axios";
import { DeviceContext, TelemetrySender } from "../types.js";
import { buildTelemetryPayload, buildBatchPayload } from "../payload/payload.builder.js";
import { config } from "../config/config.js";

export class HttpSender implements TelemetrySender {
  async send(ctx: DeviceContext): Promise<void> {
    const payload = buildTelemetryPayload();

    await axios.post(`${config.baseUrl}/datastreams/token`, payload, {
      headers: {
        Authorization: `Bearer ${ctx.deviceToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  async sendBatch(ctx: DeviceContext): Promise<void> {
    const payload = buildBatchPayload();

    await axios.post(`${config.baseUrl}/datastreams/batch`, payload, {
      headers: {
        Authorization: `Bearer ${ctx.deviceToken}`,
        "Content-Type": "application/json",
      },
    });
  }
}

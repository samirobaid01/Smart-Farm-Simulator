import axios from "axios";
import { DeviceContext, TelemetrySender, TelemetryPayload, BatchTelemetryPayload } from "../types.js";
import { config } from "../config/config.js";

export class HttpSender implements TelemetrySender {
  async send(ctx: DeviceContext, telemetryPayload: TelemetryPayload): Promise<void> {
    await axios.post(`${config.baseUrl}/datastreams/token`, telemetryPayload, {
      headers: {
        Authorization: `Bearer ${ctx.deviceToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  async sendBatch(ctx: DeviceContext, batchPayload?: BatchTelemetryPayload): Promise<void> {
    if (!batchPayload) {
      throw new Error("Batch payload is required");
    }

    await axios.post(`${config.baseUrl}/datastreams/batch`, batchPayload, {
      headers: {
        Authorization: `Bearer ${ctx.deviceToken}`,
        "Content-Type": "application/json",
      },
    });
  }
}

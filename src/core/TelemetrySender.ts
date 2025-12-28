import { DeviceContext, TelemetryPayload } from "../types.js";

export interface TelemetrySender {
  send(ctx: DeviceContext, telemetryPayload: TelemetryPayload): Promise<void>;
}

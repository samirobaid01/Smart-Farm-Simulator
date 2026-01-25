import mqtt from "mqtt";
import { TelemetrySender } from "../types.js";
import { DeviceContext, TelemetryPayload, BatchTelemetryPayload } from "../types.js";
import { config } from "../config/config.js";

export class MqttSender implements TelemetrySender {
  async send(ctx: DeviceContext, telemetryPayload: TelemetryPayload): Promise<void> {
    const topic = `devices/${ctx.deviceUuid}/datastream`;

    const client = mqtt.connect(config.mqtt.broker, {
      clientId: ctx.deviceUuid,
      username: ctx.deviceUuid,
      password: ctx.deviceToken,
    });

    client.on("connect", () => {
      console.log("🟢 MQTT connected");

      client.subscribe(topic);

      client.publish(
        topic,
        JSON.stringify({
          ...telemetryPayload,
          token: ctx.deviceToken,
        }),
        { qos: 1 }
      );
    });

    client.on("message", (_, msg) => {
      console.log("📥 MQTT received", msg.toString());
    });
  }

  async sendBatch(ctx: DeviceContext, batchPayload?: BatchTelemetryPayload): Promise<void> {
    if (!batchPayload) {
      throw new Error("Batch payload is required");
    }

    const topic = `devices/${ctx.deviceUuid}/datastream/batch`;

    const client = mqtt.connect(config.mqtt.broker, {
      clientId: ctx.deviceUuid,
      username: ctx.deviceUuid,
      password: ctx.deviceToken,
    });

    client.on("connect", () => {
      client.publish(
        topic,
        JSON.stringify({
          ...batchPayload,
          token: ctx.deviceToken,
        }),
        { qos: 1 }
      );
    });
  }
}

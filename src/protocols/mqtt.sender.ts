import mqtt from "mqtt";
import { TelemetrySender } from "../core/TelemetrySender.js";
import { buildTelemetryPayload } from "../payload/payload.builder.js";
import { DeviceContext, TelemetryPayload } from "../types.js";
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
          ...buildTelemetryPayload(),
          token: ctx.deviceToken,
        }),
        { qos: 1 }
      );
    });

    client.on("message", (_, msg) => {
      console.log("📥 MQTT received", msg.toString());
    });
  }
}

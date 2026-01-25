
import coap, { IncomingMessage, OutgoingMessage } from "coap";
import { TelemetryPayload, DeviceContext, TelemetrySender, BatchTelemetryPayload } from "../types.js";
import { config } from "../config/config.js";

/**
 * CoAP Sender
 * Supports:
 *   - send single telemetry
 *   - observe server updates
 */
export class CoapSender implements TelemetrySender {
  host: string;
  port: number;

  constructor(host?: string, port?: number) {
    this.host = host || config.coap.host;
    this.port = port || config.coap.port;
  }

  /** Send a telemetry payload */
  async send(ctx: DeviceContext, payload: TelemetryPayload): Promise<void> {
    return new Promise((resolve, reject) => {
      const req: OutgoingMessage = coap.request({
        hostname: this.host,
        port: this.port,
        pathname: "/datastreams",
        method: "POST",
        confirmable: true,
      });

      // attach device info
      const body = JSON.stringify({
        ...payload,
        token: ctx.deviceToken,
        deviceUuid: ctx.deviceUuid,
      });

      req.write(body);

      req.on("response", (res: IncomingMessage) => {
        let data = "";
        res.on("data", (chunk: Buffer) => (data += chunk.toString()));
        res.on("end", () => {
          console.log(`📥 CoAP response [${ctx.deviceUuid}]:`, data || res.code);
          resolve();
        });
      });

      req.on("error", (err) => {
        console.error(`❌ CoAP error [${ctx.deviceUuid}]:`, err.message);
        reject(err);
      });

      req.end();
    });
  }

  async sendBatch(ctx: DeviceContext, batchPayload?: BatchTelemetryPayload): Promise<void> {
    if (!batchPayload) {
      throw new Error("Batch payload is required");
    }

    return new Promise((resolve, reject) => {
      const req: OutgoingMessage = coap.request({
        hostname: this.host,
        port: this.port,
        pathname: "/datastreams/batch",
        method: "POST",
        confirmable: true,
      });

      const body = JSON.stringify({
        ...batchPayload,
        token: ctx.deviceToken,
        deviceUuid: ctx.deviceUuid,
      });

      req.write(body);

      req.on("response", (res: IncomingMessage) => {
        let data = "";
        res.on("data", (chunk: Buffer) => (data += chunk.toString()));
        res.on("end", () => {
          console.log(`📥 CoAP batch response [${ctx.deviceUuid}]:`, data || res.code);
          resolve();
        });
      });

      req.on("error", (err) => {
        console.error(`❌ CoAP batch error [${ctx.deviceUuid}]:`, err.message);
        reject(err);
      });

      req.end();
    });
  }

  /** Observe server updates for a device */
  observe(ctx: DeviceContext, path: string = "/datastreams") {
    const req: OutgoingMessage = coap.request({
      hostname: this.host,
      port: this.port,
      pathname: path,
      observe: true,
      method: "GET",
    });

    req.on("response", (res: IncomingMessage) => {
      console.log(`👁️ Observing CoAP updates [${ctx.deviceUuid}]`);
      res.on("data", (chunk: Buffer) => {
        try {
          const payload = JSON.parse(chunk.toString());
          console.log(`🔔 CoAP observed update [${ctx.deviceUuid}]:`, payload);
        } catch {
          console.log(`🔔 CoAP observed raw data [${ctx.deviceUuid}]:`, chunk.toString());
        }
      });
    });

    req.on("error", (err) => {
      console.error(`❌ CoAP observe error [${ctx.deviceUuid}]:`, err.message);
    });

    req.end();
  }
}


// export class CoapSender {
//   async send(ctx: ProtocolContext) {
//     const payload = ctx.payload;

//     const req = coap.request({
//       hostname: "localhost",
//       port: 5683,
//       method: "POST",
//       pathname: "/datastreams",
//       confirmable: true,
//     });

//     req.write(
//       JSON.stringify({
//         ...payload,          // Now TS knows this is an object
//         token: ctx.deviceToken,
//         deviceUuid: ctx.deviceUuid,
//       })
//     );

//     req.on("response", (res: any) => {
//       let data = "";
//       res.on("data", (chunk: Buffer) => (data += chunk));
//       res.on("end", () => console.log("📥 CoAP response:", data || res.code));
//     });

//     req.on("error", (err: Error) => console.error("CoAP Error:", err));
//     req.end();
//   }
// }

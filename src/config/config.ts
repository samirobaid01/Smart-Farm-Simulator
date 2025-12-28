import { ProtocolType } from "../types.js";

export const config = {
  baseUrl: "http://localhost:3000/api/v1",

  user: {
    email: "samiradmin@yopmail.com",
    password: "1234Abcd",
  },

  protocol: "mqtt" as ProtocolType,

  execution: {
    mode: "once" as "once" | "batch" | "loop",
    batchSize: 5,
    delayMs: 20000,
  },

  devices: [{ sensorId: 1 }, { sensorId: 2 }],

  mqtt: {
    broker: "mqtt://localhost:1883",
  },

  coap: {
    host: "localhost",
    port: 5683,
    observe: true,
  },
};

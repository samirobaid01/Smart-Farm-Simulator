import { ProtocolType } from "../types.js";

export const config = {
  baseUrl: "http://localhost:3000/api/v1",

  user: {
    email: "samiradmin@yopmail.com",
    password: "1234Abcd",
  },

  protocol: "http" as ProtocolType,

  execution: {
    mode: "loop" as "once" | "batch" | "loop",
    batchSize: 5,
    delayMs: 6000,
  },

  sensors: [
    { sensorId: 1 },
    { sensorId: 2 },
    { sensorId: 3 },
    { sensorId: 4 },
    { sensorId: 5 },
    { sensorId: 6 },
    { sensorId: 16 }, 
    { sensorId: 17 }
  ],

  mqtt: {
    broker: "mqtt://localhost:1883",
  },

  coap: {
    host: "localhost",
    port: 5683,
    observe: true,
  },
};

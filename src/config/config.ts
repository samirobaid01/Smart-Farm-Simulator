import { ProtocolType } from "../types.js";

export const config = {
  baseUrl: "http://localhost:3000/api/v1",

  user: {
    email: "samiradmin@yopmail.com",
    password: "1234Abcd",
  },

  protocol: "http" as ProtocolType,

  execution: {
    mode: "once" as "once" | "batch" | "loop",
    batchSize: 5,
    delayMs: 20000,
  },

  SensorDevices: [
    {
      sensorId: 1,
    }
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
export const SIMULATION_CONFIG = {
  tickIntervalMs: 5000,        // loop interval
  dayDurationMs: 60000,        // 1 simulated day = 60 sec
  accelerated: true,           // enable/disable time acceleration
  weatherEnabled: true,
  devicesEnabled: true,
  weatherChangeProbability: 0.3
};

export const DEVICES_LIST = [
  { id: "waterPump-1", type: "WATER_PUMP" },
  { id: "humidifier-1", type: "HUMIDIFIER" },
  { id: "fan-1", type: "FAN" },
  { id: "heater-1", type: "HEATER" },
  { id: "growLight-1", type: "GROW_LIGHT" }
];


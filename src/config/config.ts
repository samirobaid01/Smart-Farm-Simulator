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
      sensorName: "pH Meter - NFT System",
      TelemetryData: [
        {
          variableName: "pH Level",
          datatype: "float",
          minRange: 0,
          maxRange: 14,
        },
        {
          variableName: "pH Sensor Voltage",
          datatype: "float",
          minRange: 4,
          maxRange: 8,
        },
      ],
    },
    {
      sensorId: 2,
      sensorName: "EC TDS Meter - Main Tank",
      TelemetryData: [
        {
          variableName: "Electrical Conductivity",
          datatype: "float",
          minRange: 8,
          maxRange: 25,
        },
        {
          variableName: "Total Dissolved Solids",
          datatype: "integer",
          minRange: 30,
          maxRange: 60,
        },

        {
          variableName: "Solution Temperature",
          datatype: "float",
          minRange: 10,
          maxRange: 15,
        },
      ],
    },
    {
      sensorId: 3,
      sensorName: "Water Temperature Probe - DWC",
      TelemetryData: [
        {
          variableName: "Water Temperature",
          datatype: "float",
          minRange: 8,
          maxRange: 25,
        },
      ],
    },
    {
      sensorId: 4,
      sensorName: "Dissolved Oxygen Sensor",
      TelemetryData: [
        {
          variableName: "DO Saturation",
          datatype: "float",
          minRange: 11,
          maxRange: 21,
        },
      ],
    },
    {
      sensorId: 5,
      sensorName: "Water Level Sensor - Reservoir",
      TelemetryData: [
        {
          variableName: "Tank Capacity",
          datatype: "percentage",
          minRange: 1,
          maxRange: 10,
        },
      ],
    },
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
  tickIntervalMs: 5000, // loop interval
  dayDurationMs: 60000, // 1 simulated day = 60 sec
  accelerated: true, // enable/disable time acceleration
  weatherEnabled: true,
  devicesEnabled: true,
  weatherChangeProbability: 0.3,
};

export const DEVICES_LIST = [
  { id: "waterPump-1", type: "WATER_PUMP" },
  { id: "humidifier-1", type: "HUMIDIFIER" },
  { id: "fan-1", type: "FAN" },
  { id: "heater-1", type: "HEATER" },
  { id: "growLight-1", type: "GROW_LIGHT" },
];

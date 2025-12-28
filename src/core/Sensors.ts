import { EnvironmentState } from "./Environment.js";

export function readSensors(env: EnvironmentState) {
  return {
    temperature: env.temperature,
    humidity: env.humidity,
    soilMoisture: env.soilMoisture,
    lightLux: env.lightLux,
    oxygenPPM: env.oxygenPPM
  };
}

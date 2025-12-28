import { SIMULATION_CONFIG } from "../config/config.js";
import { FarmArea } from "./Environment.js";
import { devices, applyDeviceEffects } from "./DeviceState.js";
import { readSensors } from "./Sensors.js";
import { WeatherType, randomWeather, applyWeather } from "./Weather.js";

export class Simulator {
  areas: FarmArea[] = [];

  addArea(area: FarmArea) {
    this.areas.push(area);
  }

  start() {
    setInterval(() => {
      this.areas.forEach(area => {
        if (SIMULATION_CONFIG.weatherEnabled && Math.random() < SIMULATION_CONFIG.weatherChangeProbability) {
          const weather = randomWeather();
          applyWeather(weather, area.env);
          console.log("[SIM] Weather changed:", weather);
        }

        area.updateDrift();
        applyDeviceEffects(area);

        area.crops.forEach(c => c.advanceDay());

        const telemetry = readSensors(area.env);
        console.log("[SIM] Telemetry:", telemetry);

        area.crops.forEach(crop => {
          console.log(`[SIM] Crop ${crop.profile.name} Stage: ${crop.stage}, Days: ${crop.daysInStage}`);
        });
      });
    }, SIMULATION_CONFIG.tickIntervalMs);
  }
}

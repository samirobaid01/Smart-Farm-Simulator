import { DEVICES_LIST } from "../config/config.js";
import { FarmArea } from "./Environment.js";

export type Device = {
  id: string;
  type: string;
  on: boolean;
};

export const devices: Record<string, Device> = {};

DEVICES_LIST.forEach(d => devices[d.id] = {...d, on: false});

export function applyDeviceEffects(area: FarmArea) {
  Object.values(devices).forEach(device => {
    if (!device.on) return;
    switch(device.type) {
      case "WATER_PUMP": area.env.soilMoisture += 2.5; break;
      case "HUMIDIFIER": area.env.humidity += 3; break;
      case "FAN": area.env.temperature -= 1.5; area.env.humidity -= 4; break;
      case "HEATER": area.env.temperature += 2; break;
      case "GROW_LIGHT": area.env.lightLux += 5000; break;
    }
  });
}

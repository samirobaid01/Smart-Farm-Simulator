import { Crop } from "./Crop.js";

export type EnvironmentState = {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightLux: number;
  oxygenPPM: number;
};

export class FarmArea {
  crops: Crop[] = [];
  env: EnvironmentState = {
    temperature: 25,
    humidity: 65,
    soilMoisture: 50,
    lightLux: 14000,
    oxygenPPM: 21000
  };

  addCrop(crop: Crop) {
    this.crops.push(crop);
  }

  updateDrift() {
    this.env.temperature += (Math.random() - 0.5);
    this.env.humidity += (Math.random() - 0.5) * 2;
    this.env.soilMoisture -= Math.random() * 0.4;
    this.env.lightLux += (Math.random() - 0.5) * 500;
  }
}

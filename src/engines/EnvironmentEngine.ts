import { EnvironmentState } from "../domain/EnvironmentState.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface DriftModel {
  temperature: [number, number];
  humidity: [number, number];
  soilMoisture: [number, number];
  lightLux: [number, number];
  oxygenPPM: [number, number];
  pH: [number, number];
}

const drift: DriftModel = JSON.parse(
  readFileSync(join(__dirname, "../models/environment/drift.json"), "utf-8")
);

/**
 * Environment Engine - Applies natural drift to environment
 * Open-closed: Can be extended without modification
 */
export class EnvironmentEngine {
  /**
   * Apply natural environmental drift (weather effects, time-based changes)
   */
  applyDrift(env: EnvironmentState): void {
    env.temperature += this.rand(drift.temperature);
    env.humidity += this.rand(drift.humidity);
    env.soilMoisture += this.rand(drift.soilMoisture);
    env.lightLux += this.rand(drift.lightLux);
    env.oxygenPPM += this.rand(drift.oxygenPPM);
    env.pH += this.rand(drift.pH);

    // Clamp values to realistic ranges
    env.temperature = Math.max(-10, Math.min(50, env.temperature));
    env.humidity = Math.max(0, Math.min(100, env.humidity));
    env.soilMoisture = Math.max(0, Math.min(100, env.soilMoisture));
    env.lightLux = Math.max(0, env.lightLux);
    env.oxygenPPM = Math.max(0, env.oxygenPPM);
    env.pH = Math.max(0, Math.min(14, env.pH));
  }

  private rand([min, max]: number[]): number {
    return Math.random() * (max - min) + min;
  }
}


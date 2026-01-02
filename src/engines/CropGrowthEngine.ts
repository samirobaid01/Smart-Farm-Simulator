import { CropState } from "../domain/CropState.js";
import { EnvironmentState } from "../domain/EnvironmentState.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface CropModel {
  name: string;
  optimal: {
    temperature?: [number, number];
    humidity?: [number, number];
    soilMoisture?: [number, number];
    lightLux?: [number, number];
  };
  growthRate: number;
  healthDecayRate: number;
}

/**
 * Crop Growth Engine - Evaluates and updates crop state based on environment
 * Open-closed: New crops can be added via JSON files
 */
export class CropGrowthEngine {
  /**
   * Evaluate crop health and growth based on current environment
   */
  evaluate(crop: CropState, env: EnvironmentState): void {
    try {
      const model = this.loadCropModel(crop.cropType);
      if (!model) {
        console.warn(`Crop model not found for: ${crop.cropType}`);
        return;
      }

      // Calculate health based on optimal ranges
      const healthDelta = this.calculateHealthDelta(env, model);
      crop.healthScore = Math.max(0, Math.min(100, crop.healthScore + healthDelta));

      // Apply growth rate (slower if health is poor)
      const growthMultiplier = crop.healthScore / 100;
      crop.growthStage = Math.min(1, crop.growthStage + model.growthRate * growthMultiplier);

      // Calculate yield score
      crop.yieldScore = crop.growthStage * crop.healthScore;
    } catch (error) {
      console.error(`Error evaluating crop ${crop.cropType}:`, error);
    }
  }

  private calculateHealthDelta(env: EnvironmentState, model: CropModel): number {
    let healthDelta = 0.2; // Base positive health change

    // Check each optimal range
    if (model.optimal.temperature) {
      const [min, max] = model.optimal.temperature;
      if (env.temperature < min || env.temperature > max) {
        healthDelta -= model.healthDecayRate;
      }
    }

    if (model.optimal.humidity) {
      const [min, max] = model.optimal.humidity;
      if (env.humidity < min || env.humidity > max) {
        healthDelta -= model.healthDecayRate;
      }
    }

    if (model.optimal.soilMoisture) {
      const [min, max] = model.optimal.soilMoisture;
      if (env.soilMoisture < min || env.soilMoisture > max) {
        healthDelta -= model.healthDecayRate;
      }
    }

    if (model.optimal.lightLux) {
      const [min, max] = model.optimal.lightLux;
      if (env.lightLux < min || env.lightLux > max) {
        healthDelta -= model.healthDecayRate * 0.5; // Light is less critical
      }
    }

    return healthDelta;
  }

  private loadCropModel(cropType: string): CropModel | null {
    try {
      const normalizedType = cropType.toLowerCase();
      const modelPath = join(__dirname, "../models/crops", `${normalizedType}.json`);
      const content = readFileSync(modelPath, "utf-8");
      return JSON.parse(content) as CropModel;
    } catch {
      return null;
    }
  }
}



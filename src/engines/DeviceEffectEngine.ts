import { DeviceState } from "../domain/DeviceState.js";
import { EnvironmentState } from "../domain/EnvironmentState.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface DeviceModel {
  type: string;
  effects: Partial<Record<keyof EnvironmentState, number>>;
}

/**
 * Device Effect Engine - Applies device effects to environment
 * Open-closed: Unknown devices are ignored (can be extended via JSON files)
 */
export class DeviceEffectEngine {
  /**
   * Apply effects from active devices to the environment
   */
  apply(devices: DeviceState[], env: EnvironmentState): void {
    for (const device of devices) {
      if (device.status !== "ON") continue;

      try {
        const model = this.loadDeviceModel(device.type);
        if (!model) continue;

        // Apply each effect from the device model
        for (const key in model.effects) {
          const effect = model.effects[key as keyof EnvironmentState];
          if (effect !== undefined && key in env) {
            (env[key as keyof EnvironmentState] as number) += effect * (device.level ?? 1);
          }
        }
      } catch (error) {
        // Unknown device → ignored (open-closed principle)
        // Silently continue to allow future device types
      }
    }
  }

  private loadDeviceModel(deviceType: string): DeviceModel | null {
    try {
      const normalizedType = deviceType.toLowerCase().replace("_", "");
      const modelPath = join(__dirname, "../models/devices", `${normalizedType}.json`);
      const content = readFileSync(modelPath, "utf-8");
      return JSON.parse(content) as DeviceModel;
    } catch {
      return null;
    }
  }
}



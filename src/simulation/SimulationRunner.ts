import { EnvironmentEngine } from "../engines/EnvironmentEngine.js";
import { DeviceEffectEngine } from "../engines/DeviceEffectEngine.js";
import { SensorEngine } from "../engines/SensorEngine.js";
import { CropGrowthEngine } from "../engines/CropGrowthEngine.js";
import { FailureEngine } from "../engines/FailureEngine.js";
import { EnvironmentState } from "../domain/EnvironmentState.js";
import { DeviceState } from "../domain/DeviceState.js";
import { CropState } from "../domain/CropState.js";

export interface SimulationTickCallback {
  (sensorReadings: Partial<EnvironmentState>, crops: CropState[]): void;
}

/**
 * Simulation Runner - Orchestrates the simulation tick
 * Coordinates all engines in the correct order
 */
export class SimulationRunner {
  private envEngine: EnvironmentEngine;
  private deviceEngine: DeviceEffectEngine;
  private sensorEngine: SensorEngine;
  private cropEngine: CropGrowthEngine;
  private failureEngine: FailureEngine;

  constructor(failureProbability: number = 0.01) {
    this.envEngine = new EnvironmentEngine();
    this.deviceEngine = new DeviceEffectEngine();
    this.sensorEngine = new SensorEngine();
    this.cropEngine = new CropGrowthEngine();
    this.failureEngine = new FailureEngine(failureProbability);
  }

  /**
   * Execute one simulation tick
   * Order: Drift → Device Effects → Failures → Sensor Read → Crop Growth
   */
  tick(
    env: EnvironmentState,
    devices: DeviceState[],
    crops: CropState[],
    callback?: SimulationTickCallback
  ): Partial<EnvironmentState> {
    // 1. Apply natural environmental drift (weather, time)
    this.envEngine.applyDrift(env);

    // 2. Apply device effects (AC, fan, pump, etc.)
    this.deviceEngine.apply(devices, env);

    // 3. Inject probabilistic failures
    this.failureEngine.inject(env);
    this.failureEngine.injectDeviceFailure(devices);

    // 4. Read sensor values from environment
    const sensorReadings = this.sensorEngine.read(env);

    // 5. Evaluate crop growth and health
    for (const crop of crops) {
      this.cropEngine.evaluate(crop, env);
    }

    // 6. Callback with sensor readings and crop states
    if (callback) {
      callback(sensorReadings, crops);
    }

    return sensorReadings;
  }

  /**
   * Initialize environment with default values from config
   * Data-driven: reads from simulation.json, no hardcoding
   */
  static createInitialEnvironment(): EnvironmentState {
    // Load initial values from simulation.json (data-driven, no hardcoding)
    try {
      const { readFileSync } = require("fs");
      const { join, dirname } = require("path");
      const { fileURLToPath } = require("url");
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      
      const simulationConfig = JSON.parse(
        readFileSync(join(__dirname, "../config/simulation.json"), "utf-8")
      );
      
      return {
        temperature: simulationConfig.initialEnvironment.temperature || 22,
        humidity: simulationConfig.initialEnvironment.humidity || 60,
        soilMoisture: simulationConfig.initialEnvironment.soilMoisture || 50,
        lightLux: simulationConfig.initialEnvironment.lightLux || 10000,
        oxygenPPM: simulationConfig.initialEnvironment.oxygenPPM || 21,
        pH: simulationConfig.initialEnvironment.pH || 5.0,
      };
    } catch (error) {
      // Fallback to defaults if config not found
      return {
        temperature: 22,
        humidity: 60,
        soilMoisture: 50,
        lightLux: 10000,
        oxygenPPM: 21,
        pH: 7.0,
      };
    }
  }
}


import { SimulationRunner } from "../simulation/SimulationRunner.js";
import { DeviceManager } from "./DeviceManager.js";
import { SimulationTelemetryAdapter } from "./SimulationTelemetryAdapter.js";
import { TelemetryService } from "./TelemetryService.js";
import { EnvironmentState } from "../domain/EnvironmentState.js";
import { DeviceState } from "../domain/DeviceState.js";
import { DeviceContext } from "../types.js";
import { config, DEVICES_LIST } from "../config/config.js";

/**
 * Closed-Loop Simulation Service
 * Orchestrates the complete feedback loop:
 * 1. Send sensor data → Backend
 * 2. Receive device commands ← Backend (via socket)
 * 3. Update device states
 * 4. Apply device effects → Environment changes
 * 5. Generate new sensor readings
 * 6. Loop
 */
export class ClosedLoopSimulation {
  private runner: SimulationRunner;
  private deviceManager: DeviceManager;
  private telemetryAdapter: SimulationTelemetryAdapter;
  private environment: EnvironmentState;
  private isRunning: boolean = false;
  private tickInterval: NodeJS.Timeout | null = null;
  private onDeviceCommandCallback?: (command: any) => void;

  constructor(
    telemetryService: TelemetryService,
    deviceContexts: DeviceContext[],
    deviceSensorMap: Map<string, number>,
    initialTemperature?: number
  ) {
    this.runner = new SimulationRunner(0.01); // 1% failure probability
    this.deviceManager = new DeviceManager();
    this.telemetryAdapter = new SimulationTelemetryAdapter(
      telemetryService,
      deviceContexts,
      deviceSensorMap
    );

    // Initialize environment from config (data-driven, no hardcoding)
    this.environment = SimulationRunner.createInitialEnvironment();

    // Initialize devices from config
    this.deviceManager.initialize(DEVICES_LIST || []);
  }

  /**
   * Set callback for when device commands are received
   */
  setDeviceCommandHandler(callback: (command: any) => void): void {
    this.onDeviceCommandCallback = callback;
  }

  /**
   * Process device command from backend
   */
  processDeviceCommand(command: any): void {
    console.log("🔧 Processing device command:", command);

    // Update device state
    const updated = this.deviceManager.updateDevice(command);

    if (updated && this.onDeviceCommandCallback) {
      this.onDeviceCommandCallback(command);
    }
  }

  /**
   * Start the closed-loop simulation
   */
  start(tickIntervalMs: number = 5000): void {
    if (this.isRunning) {
      console.warn("⚠️  Simulation already running");
      return;
    }

    this.isRunning = true;
    console.log("🚀 Starting closed-loop simulation...");
    console.log(`📊 Initial environment:`, {
      temperature: this.environment.temperature.toFixed(2),
      humidity: this.environment.humidity.toFixed(2),
      soilMoisture: this.environment.soilMoisture.toFixed(2),
      pH: this.environment.pH.toFixed(2),
    });

    // Run first tick immediately
    this.runTick();

    // Then run on interval
    this.tickInterval = setInterval(() => {
      this.runTick();
    }, tickIntervalMs);
  }

  /**
   * Stop the simulation
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    console.log("⏹️  Simulation stopped");
  }

  /**
   * Execute one simulation tick
   */
  private async runTick(): Promise<void> {
    try {
      // Get current device states
      const devices = this.deviceManager.getAllDevices();

      // Run simulation tick (applies drift, device effects, reads sensors)
      const sensorReadings = this.runner.tick(
        this.environment,
        devices,
        [], // No crops for now
        (readings, crops) => {
          // Callback after tick completes
          console.log("📡 Sensor readings:", {
            temperature: readings.temperature?.toFixed(2),
            humidity: readings.humidity?.toFixed(2),
            soilMoisture: readings.soilMoisture?.toFixed(2),
            pH: readings.pH?.toFixed(2),
          });
        }
      );

      // Send sensor readings to backend
      await this.telemetryAdapter.sendEnvironmentReadings(this.environment, new Map());

      // Log current state
      const activeDevices = devices.filter((d) => d.status === "ON");
      if (activeDevices.length > 0) {
        console.log(
          `🔌 Active devices: ${activeDevices.map((d) => `${d.type}(${d.deviceUuid})`).join(", ")}`
        );
      }
    } catch (error) {
      console.error("❌ Error in simulation tick:", error);
    }
  }

  /**
   * Get current environment state
   */
  getEnvironment(): EnvironmentState {
    return { ...this.environment };
  }

  /**
   * Get current device states
   */
  getDevices(): DeviceState[] {
    return this.deviceManager.getAllDevices();
  }
}


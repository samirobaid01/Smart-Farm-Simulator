import { TelemetryService } from "./TelemetryService.js";
import { DeviceContext } from "../types.js";
import { EnvironmentState } from "../domain/EnvironmentState.js";
import { TelemetryPayload } from "../types.js";

/**
 * Simulation Telemetry Adapter
 * Maps simulation environment state to telemetry payloads and sends them
 */
export class SimulationTelemetryAdapter {
  constructor(
    private telemetryService: TelemetryService,
    private deviceContexts: DeviceContext[],
    private deviceSensorMap: Map<string, number>
  ) {}

  /**
   * Send environment sensor readings as telemetry
   * Maps environment state to telemetry payloads based on sensor configuration
   */
  async sendEnvironmentReadings(
    env: EnvironmentState,
    sensorMapping: Map<number, string[]>
  ): Promise<void> {
    // Create a mapping of environment properties to sensor variables
    const envToTelemetry: Record<string, { sensorId: number; variableName: string }[]> = {};

    // Map temperature to sensors that measure it
    if (env.temperature !== undefined) {
      envToTelemetry["temperature"] = [
        { sensorId: 3, variableName: "Water Temperature" }, // Sensor 3 measures water temp
      ];
    }

    // Map humidity (if we have a humidity sensor)
    // Map soil moisture (if we have a soil moisture sensor)
    // Map light (if we have a light sensor)
    // Map oxygen (if we have an oxygen sensor)

    // For each device context, send relevant telemetry
    for (const deviceContext of this.deviceContexts) {
      const sensorId = this.deviceSensorMap.get(deviceContext.deviceUuid);
      if (!sensorId) continue;

      // Create telemetry payloads from environment
      const payloads = this.createTelemetryFromEnvironment(env, sensorId);

      // Send each payload
      for (const payload of payloads) {
        try {
          await this.telemetryService.sendPayload(deviceContext, payload);
          console.log(`📤 Sent: ${payload.variableName} = ${payload.value}`);
        } catch (error) {
          console.error(`❌ Failed to send ${payload.variableName}:`, error);
        }
      }
    }
  }

  /**
   * Create telemetry payloads from environment state for a specific sensor
   * Maps environment properties to sensor variables based on sensor configuration
   */
  private createTelemetryFromEnvironment(
    env: EnvironmentState,
    sensorId: number
  ): TelemetryPayload[] {
    const payloads: TelemetryPayload[] = [];
    const timestamp = new Date().toISOString();

    // Map sensor IDs to their environment readings based on config
    switch (sensorId) {
      case 1:
        // pH Meter - NFT System (pH Level, pH Sensor Voltage)
        if (env.pH !== undefined) {
          payloads.push({
            variableName: "pH Level",
            value: env.pH.toFixed(2),
            recievedAt: timestamp,
          });
        }
        break;

      case 2:
        // EC TDS Meter - Main Tank (Electrical Conductivity, TDS, Solution Temperature)
        if (env.temperature !== undefined) {
          payloads.push({
            variableName: "Solution Temperature",
            value: env.temperature.toFixed(2),
            recievedAt: timestamp,
          });
        }
        break;

      case 3:
        // Water Temperature Probe - DWC
        if (env.temperature !== undefined) {
          payloads.push({
            variableName: "Water Temperature",
            value: env.temperature.toFixed(2),
            recievedAt: timestamp,
          });
        }
        break;

      case 4:
        // Dissolved Oxygen Sensor
        if (env.oxygenPPM !== undefined) {
          payloads.push({
            variableName: "DO Saturation",
            value: env.oxygenPPM.toFixed(2),
            recievedAt: timestamp,
          });
        }
        break;

      case 5:
        // Water Level Sensor - Reservoir (Tank Capacity)
        // Maps to soilMoisture as a proxy for water level
        if (env.soilMoisture !== undefined) {
          payloads.push({
            variableName: "Tank Capacity",
            value: Math.round(env.soilMoisture / 10).toString(), // Convert to 1-10 range
            recievedAt: timestamp,
          });
        }
        break;

      default:
        // Generic fallback - send temperature if available
        if (env.temperature !== undefined) {
          payloads.push({
            variableName: "Temperature",
            value: env.temperature.toFixed(2),
            recievedAt: timestamp,
          });
        }
    }

    return payloads;
  }
}


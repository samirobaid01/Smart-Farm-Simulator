import { TelemetryService } from "../core/TelemetryService.js";
import { DeviceContext } from "../types.js";
import { EnvironmentState } from "../domain/EnvironmentState.js";

/**
 * Telemetry Adapter - Safe boundary between simulation and existing telemetry system
 * Maps simulation sensor readings to telemetry payloads
 * Maintains backward compatibility with existing TelemetryService
 */
export class TelemetryAdapter {
  constructor(
    private telemetryService: TelemetryService,
    private deviceContexts: DeviceContext[],
    private deviceSensorMap: Map<string, number>
  ) {}

  /**
   * Send sensor readings as telemetry payloads
   * Maps environment state to existing telemetry format
   */
  async sendSensorReadings(sensorReadings: Partial<EnvironmentState>): Promise<void> {
    // For each device context, send relevant sensor readings
    for (const deviceContext of this.deviceContexts) {
      const sensorId = this.deviceSensorMap.get(deviceContext.deviceUuid);
      if (!sensorId) continue;

      // Map environment readings to telemetry payloads
      // This is a simplified mapping - can be extended based on sensor configuration
      const payloads = this.mapEnvironmentToTelemetry(sensorReadings, sensorId);

      for (const payload of payloads) {
        // Use the existing telemetry service to send
        // Note: This requires extending TelemetryService or using a different approach
        // For now, we'll log that we would send this
        console.log(`[TelemetryAdapter] Would send: ${payload.variableName} = ${payload.value}`);
      }
    }
  }

  /**
   * Map environment state to telemetry payloads based on sensor configuration
   */
  private mapEnvironmentToTelemetry(
    readings: Partial<EnvironmentState>,
    sensorId: number
  ): Array<{ variableName: string; value: string; recievedAt: string }> {
    const payloads: Array<{ variableName: string; value: string; recievedAt: string }> = [];

    // Simple mapping - can be enhanced to match actual sensor configurations
    if (readings.temperature !== undefined) {
      payloads.push({
        variableName: "Temperature",
        value: readings.temperature.toFixed(2),
        recievedAt: new Date().toISOString(),
      });
    }

    if (readings.humidity !== undefined) {
      payloads.push({
        variableName: "Humidity",
        value: readings.humidity.toFixed(2),
        recievedAt: new Date().toISOString(),
      });
    }

    if (readings.soilMoisture !== undefined) {
      payloads.push({
        variableName: "Soil Moisture",
        value: readings.soilMoisture.toFixed(2),
        recievedAt: new Date().toISOString(),
      });
    }

    if (readings.lightLux !== undefined) {
      payloads.push({
        variableName: "Light Lux",
        value: readings.lightLux.toFixed(0),
        recievedAt: new Date().toISOString(),
      });
    }

    if (readings.oxygenPPM !== undefined) {
      payloads.push({
        variableName: "Oxygen PPM",
        value: readings.oxygenPPM.toFixed(2),
        recievedAt: new Date().toISOString(),
      });
    }

    return payloads;
  }
}



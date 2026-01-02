/**
 * Pure state representation of the environment
 * No business logic - just data
 */
export interface EnvironmentState {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightLux: number;
  oxygenPPM: number;
  pH: number; // pH level (0-14)
}


import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export type StageEnv = {
  temperature: [number, number];
  humidity: [number, number];
  soilMoisture: [number, number];
  lightLux: [number, number];
};

export interface CropProfile {
  name: string;
  stages: string[];
  stageDurations: number[];
  optimalEnv: Record<string, StageEnv>;
}

/**
 * NodeNext / ESM safe __dirname
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadCrops(): CropProfile[] {
  const data = fs.readFileSync(
    path.resolve(__dirname, "../config/crops.json"),
    "utf-8"
  );

  return JSON.parse(data) as CropProfile[];
}

export function chooseCrop(name: string): CropProfile | undefined {
  const crops = loadCrops();
  return crops.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
}

import { FarmArea } from "./Environment.js";

export enum WeatherType {
  CLEAR = "CLEAR",
  CLOUDY = "CLOUDY",
  RAINY = "RAINY",
  HEATWAVE = "HEATWAVE",
  COLD_SNAP = "COLD_SNAP"
}

export function randomWeather(): WeatherType {
  const values = Object.values(WeatherType);
  return values[Math.floor(Math.random() * values.length)];
}

export function applyWeather(weather: WeatherType, env: FarmArea["env"]) {
  const effects: Record<WeatherType, { t: number; h: number; l: number }> = {
    CLEAR: { t: 1, h: -2, l: 2000 },
    CLOUDY: { t: -1, h: 3, l: -4000 },
    RAINY: { t: -2, h: 6, l: -6000 },
    HEATWAVE: { t: 4, h: -5, l: 3000 },
    COLD_SNAP: { t: -5, h: 2, l: -2000 }
  };
  env.temperature += effects[weather].t;
  env.humidity += effects[weather].h;
  env.lightLux += effects[weather].l;
}

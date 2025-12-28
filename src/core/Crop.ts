import { CropProfile } from "./CropLoader.js";
import { SIMULATION_CONFIG } from "../config/config.js";

export class Crop {
  profile: CropProfile;
  stageIndex: number = 0;
  daysInStage: number = 0;

  constructor(profile: CropProfile) {
    this.profile = profile;
  }

  get stage(): string {
    return this.profile.stages[this.stageIndex];
  }

  advanceDay() {
    if (!SIMULATION_CONFIG.accelerated) return;
    this.daysInStage++;
    const duration = this.profile.stageDurations[this.stageIndex];
    if (duration > 0 && this.daysInStage >= duration) {
      this.stageIndex++;
      this.daysInStage = 0;
    }
  }

  getOptimalEnv() {
    return this.profile.optimalEnv[this.stage] || {};
  }
}

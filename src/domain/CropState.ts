/**
 * Pure state representation of a crop
 * Growth stage: 0 (seed) → 1 (harvest)
 * Health score: 0 → 100
 * Yield score: computed from growth and health
 */
export interface CropState {
  cropType: string;
  growthStage: number; // 0 → 1
  healthScore: number; // 0 → 100
  yieldScore: number; // computed
}



/* ── ML Type Definitions ── */

export interface TrainingData {
  features: number[][];
  labels: number[];
}

export interface ModelWeights {
  randomForest: number;
  knn: number;
  logisticRegression: number;
}

export const ENSEMBLE_WEIGHTS: ModelWeights = {
  randomForest: 0.50,
  knn: 0.25,
  logisticRegression: 0.25,
};

export const LABEL_MAP: Record<number, string> = {
  0: "Healthy",
  1: "Degraded",
  2: "Danger",
};

export const LABEL_REVERSE_MAP: Record<string, number> = {
  Healthy: 0,
  Degraded: 1,
  Danger: 2,
};

export const FEATURE_NAMES = [
  "rms_norm",
  "crest_factor",
  "kurtosis",
  "temperature_delta",
] as const;

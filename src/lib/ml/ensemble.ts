/* ── Weighted Ensemble Prediction Engine ── */

import { getTrainedModels, scaleSingle } from "./train";
import { ENSEMBLE_WEIGHTS, LABEL_MAP } from "./types";
import type { SensorReading, PredictionResult, HealthStatus } from "../types";

/**
 * Run weighted ensemble prediction on normalized sensor features.
 *
 * The 4 features are already motor-agnostic (computed on ESP32):
 *   rms_norm, crest_factor, kurtosis, temperature_delta
 *
 * Final_Probability(class) = 0.50 × RF + 0.25 × KNN + 0.25 × LR
 */
export async function predict(reading: SensorReading): Promise<PredictionResult> {
  const models = await getTrainedModels();

  // Build feature vector from the 4 normalized features (order must match CSV columns)
  const featureVector = [
    reading.rms_norm,
    reading.crest_factor,
    reading.kurtosis,
    reading.temperature_delta,
  ];

  const scaled = scaleSingle(featureVector, models.scaler);

  // ── Random Forest probabilities ──
  const rfPredictions = models.rf.predictionValues([ scaled ]);
  // predictionValues returns a Matrix. Convert to 2D array and get the first row
  const rfArray = rfPredictions ? rfPredictions.to2DArray()[0] : null;
  const rfRaw = rfArray ? normalizeTreePredictions(rfArray) : [1/3, 1/3, 1/3];

  // ── KNN probabilities ──
  const knnPred = models.knn.predict([scaled]);
  // KNN doesn't give probabilities directly, so we use a softmax-like approach
  const knnClass = knnPred[0];
  const knnProbs = createPseudoProbabilities(knnClass, 3, 0.85);

  // ── Logistic Regression probabilities ──
  const lrProbs = models.lr.predictProba(scaled);

  // ── Weighted ensemble ──
  const ensembleProbs: number[] = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    ensembleProbs[c] =
      ENSEMBLE_WEIGHTS.randomForest * rfRaw[c] +
      ENSEMBLE_WEIGHTS.knn * knnProbs[c] +
      ENSEMBLE_WEIGHTS.logisticRegression * lrProbs[c];
  }

  // Normalize
  const total = ensembleProbs.reduce((a, b) => a + b, 0) || 1;
  for (let c = 0; c < 3; c++) ensembleProbs[c] /= total;

  // Determine predicted class
  let maxIdx = 0;
  for (let c = 1; c < 3; c++) {
    if (ensembleProbs[c] > ensembleProbs[maxIdx]) maxIdx = c;
  }

  const status = LABEL_MAP[maxIdx] as HealthStatus;
  const confidence = ensembleProbs[maxIdx];

  return {
    status,
    confidence,
    probabilities: {
      Healthy: Math.round(ensembleProbs[0] * 10000) / 10000,
      Degraded: Math.round(ensembleProbs[1] * 10000) / 10000,
      Danger: Math.round(ensembleProbs[2] * 10000) / 10000,
    },
    perModel: {
      randomForest: {
        Healthy: Math.round(rfRaw[0] * 10000) / 10000,
        Degraded: Math.round(rfRaw[1] * 10000) / 10000,
        Danger: Math.round(rfRaw[2] * 10000) / 10000,
      },
      knn: {
        Healthy: Math.round(knnProbs[0] * 10000) / 10000,
        Degraded: Math.round(knnProbs[1] * 10000) / 10000,
        Danger: Math.round(knnProbs[2] * 10000) / 10000,
      },
      logisticRegression: {
        Healthy: Math.round(lrProbs[0] * 10000) / 10000,
        Degraded: Math.round(lrProbs[1] * 10000) / 10000,
        Danger: Math.round(lrProbs[2] * 10000) / 10000,
      },
    },
  };
}

/**
 * Normalize Random Forest tree prediction counts to probabilities.
 */
function normalizeTreePredictions(predictions: number | number[]): number[] {
  if (typeof predictions === 'number') {
    return createPseudoProbabilities(predictions, 3, 0.85);
  }
  
  // If it's an array of votes/values per class
  if (Array.isArray(predictions) && predictions.length >= 3) {
    const total = predictions.reduce((a: number, b: number) => a + b, 0) || 1;
    return predictions.slice(0, 3).map((v: number) => v / total);
  }
  
  return [1/3, 1/3, 1/3];
}

/**
 * Create pseudo-probabilities from a single class prediction.
 * Assigns `mainProb` to the predicted class and distributes the rest.
 */
function createPseudoProbabilities(predictedClass: number, numClasses: number, mainProb: number): number[] {
  const probs = new Array(numClasses).fill((1 - mainProb) / (numClasses - 1));
  probs[predictedClass] = mainProb;
  return probs;
}

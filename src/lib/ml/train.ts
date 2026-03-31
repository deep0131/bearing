/* ── ML Model Training ── */
/* Trains KNN, Random Forest, and Logistic Regression on CSV dataset */

import KNN from "ml-knn";
import { RandomForestClassifier } from "ml-random-forest";
import { generateTrainingData } from "./data";
import type { TrainingData } from "./types";

export interface TrainedModels {
  knn: KNN;
  rf: RandomForestClassifier;
  // Logistic Regression implemented manually (multiclass one-vs-rest)
  lr: LogisticRegressionOVR;
  scaler: { means: number[]; stds: number[] };
}

/* ── StandardScaler ── */
function computeScaler(features: number[][]): { means: number[]; stds: number[] } {
  const n = features.length;
  const d = features[0].length;
  const means = new Array(d).fill(0);
  const stds = new Array(d).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      means[j] += features[i][j];
    }
  }
  for (let j = 0; j < d; j++) means[j] /= n;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      stds[j] += (features[i][j] - means[j]) ** 2;
    }
  }
  for (let j = 0; j < d; j++) stds[j] = Math.sqrt(stds[j] / n) || 1;

  return { means, stds };
}

export function scaleFeatures(features: number[][], scaler: { means: number[]; stds: number[] }): number[][] {
  return features.map(row =>
    row.map((val, j) => (val - scaler.means[j]) / scaler.stds[j])
  );
}

export function scaleSingle(features: number[], scaler: { means: number[]; stds: number[] }): number[] {
  return features.map((val, j) => (val - scaler.means[j]) / scaler.stds[j]);
}

/* ── Simple Logistic Regression (One-vs-Rest for multiclass) ── */
function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, z))));
}

class BinaryLogisticRegression {
  weights: number[] = [];
  bias: number = 0;

  train(X: number[][], y: number[], lr: number = 0.1, epochs: number = 200) {
    const n = X.length;
    const d = X[0].length;
    this.weights = new Array(d).fill(0);
    this.bias = 0;

    for (let epoch = 0; epoch < epochs; epoch++) {
      const dw = new Array(d).fill(0);
      let db = 0;

      for (let i = 0; i < n; i++) {
        let z = this.bias;
        for (let j = 0; j < d; j++) z += this.weights[j] * X[i][j];
        const pred = sigmoid(z);
        const error = pred - y[i];
        for (let j = 0; j < d; j++) dw[j] += error * X[i][j];
        db += error;
      }

      for (let j = 0; j < d; j++) this.weights[j] -= lr * (dw[j] / n);
      this.bias -= lr * (db / n);
    }
  }

  predictProba(x: number[]): number {
    let z = this.bias;
    for (let j = 0; j < x.length; j++) z += this.weights[j] * x[j];
    return sigmoid(z);
  }
}

export class LogisticRegressionOVR {
  private classifiers: BinaryLogisticRegression[] = [];
  private numClasses: number = 0;

  train(X: number[][], y: number[], numClasses: number = 3) {
    this.numClasses = numClasses;
    this.classifiers = [];

    for (let c = 0; c < numClasses; c++) {
      const binaryLabels = y.map(label => (label === c ? 1 : 0));
      const clf = new BinaryLogisticRegression();
      clf.train(X, binaryLabels, 0.1, 300);
      this.classifiers.push(clf);
    }
  }

  predictProba(x: number[]): number[] {
    const rawProbs = this.classifiers.map(clf => clf.predictProba(x));
    const sum = rawProbs.reduce((a, b) => a + b, 0) || 1;
    return rawProbs.map(p => p / sum);
  }
}

/* ── Singleton model cache ── */
let cachedModels: TrainedModels | null = null;

export async function getTrainedModels(): Promise<TrainedModels> {
  if (cachedModels) return cachedModels;

  console.log("🔧 Training ML models on CSV dataset...");
  const startTime = Date.now();

  const data: TrainingData = generateTrainingData();

  // Scale features (6 normalized features from CSV)
  const scaler = computeScaler(data.features);
  const scaledFeatures = scaleFeatures(data.features, scaler);

  // 1. Train KNN (k=7)
  console.log("  ├─ Training KNN...");
  const knn = new KNN(scaledFeatures, data.labels, { k: 7 });

  // 2. Train Random Forest
  console.log("  ├─ Training Random Forest...");
  const rf = new RandomForestClassifier({
    nEstimators: 50,
    maxFeatures: 0.7,
    seed: 42,
    useSampleBagging: true,
  });
  rf.train(scaledFeatures, data.labels);

  // 3. Train Logistic Regression (One-vs-Rest)
  console.log("  └─ Training Logistic Regression...");
  const lr = new LogisticRegressionOVR();
  lr.train(scaledFeatures, data.labels, 3);

  const elapsed = Date.now() - startTime;
  console.log(`✅ All models trained in ${elapsed}ms (${data.features.length} samples, ${data.features[0].length} features)`);

  cachedModels = { knn, rf, lr, scaler };
  return cachedModels;
}

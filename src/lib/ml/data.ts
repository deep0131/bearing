/* ── Bearing Health Data Loader ── */
/* Loads the real CSV dataset with motor-agnostic normalized features */

import { TrainingData, LABEL_REVERSE_MAP } from "./types";
import * as fs from "fs";
import * as path from "path";

// Seeded random number generator for reproducible train/test splits
class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return this.seed / 2147483647;
  }
}

/**
 * Parse the CSV dataset file into TrainingData.
 *
 * CSV columns: rms_norm, crest_factor, kurtosis, temperature_delta, freq_ratio, spectral_energy, label
 * Labels: "Healthy" | "Degraded" | "Danger"
 */
function parseCSV(csvContent: string): TrainingData {
  const lines = csvContent.trim().split("\n");
  const header = lines[0].split(",");

  // Validate header
  const expectedCols = ["rms_norm", "crest_factor", "kurtosis", "temperature_delta", "freq_ratio", "spectral_energy", "label"];
  for (const col of expectedCols) {
    if (!header.includes(col)) {
      throw new Error(`Missing expected column: ${col}. Found: ${header.join(", ")}`);
    }
  }

  const featureCols = expectedCols.slice(0, 6);
  const featureIndices = featureCols.map(col => header.indexOf(col));
  const labelIndex = header.indexOf("label");

  const features: number[][] = [];
  const labels: number[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length < header.length) continue;

    const featureRow = featureIndices.map(idx => parseFloat(parts[idx]));
    const labelStr = parts[labelIndex].trim();
    const labelNum = LABEL_REVERSE_MAP[labelStr];

    if (labelNum === undefined) {
      console.warn(`Unknown label "${labelStr}" on line ${i + 1}, skipping`);
      continue;
    }

    // Skip rows with NaN values
    if (featureRow.some(v => isNaN(v))) {
      console.warn(`NaN feature on line ${i + 1}, skipping`);
      continue;
    }

    features.push(featureRow);
    labels.push(labelNum);
  }

  return { features, labels };
}

/**
 * Shuffle data with a seeded RNG for reproducibility.
 */
function shuffleData(data: TrainingData, seed: number = 123): TrainingData {
  const rng = new SeededRandom(seed);
  const indices = Array.from({ length: data.features.length }, (_, i) => i);

  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return {
    features: indices.map(i => data.features[i]),
    labels: indices.map(i => data.labels[i]),
  };
}

/**
 * Load training data from the CSV dataset.
 *
 * At build time (Node.js) this reads the file from disk.
 * The data contains 6 normalized, motor-agnostic features:
 *   - rms_norm:          RMS / baseline_rms (1.0 = healthy baseline)
 *   - crest_factor:      peak / rms (ratio, scale-independent)
 *   - kurtosis:          4th statistical moment (impulse detection)
 *   - temperature_delta: temp - baseline_temp (relative rise °C)
 *   - freq_ratio:        dominant_freq / baseline_freq (1.0 = normal)
 *   - spectral_energy:   peak_amplitude / total_spectral_power
 */
export function generateTrainingData(): TrainingData {
  // Resolve path to the CSV data file
  const csvPath = path.resolve(process.cwd(), "data", "bearing_health_dataset.csv");

  if (!fs.existsSync(csvPath)) {
    throw new Error(`Dataset not found at: ${csvPath}. Ensure data/bearing_health_dataset.csv exists.`);
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const rawData = parseCSV(csvContent);

  console.log(`📊 Loaded ${rawData.features.length} samples from CSV dataset`);

  // Count per class
  const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0 };
  rawData.labels.forEach(l => counts[l]++);
  console.log(`   Healthy: ${counts[0]}, Degraded: ${counts[1]}, Danger: ${counts[2]}`);

  return shuffleData(rawData);
}

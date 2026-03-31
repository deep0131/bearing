/* ── Shared TypeScript interfaces for BearingPulse ── */

export interface SensorReading {
  // Normalized features (motor-agnostic)
  rms_norm: number;
  crest_factor: number;
  kurtosis: number;
  temperature_delta: number;
  freq_ratio: number;
  spectral_energy: number;
  // Metadata
  timestamp?: number;
  device_id?: string;
  // Raw values (for display / debugging)
  raw?: {
    rms: number;
    peak: number;
    temp: number;
    fft_freq: number;
    fft_amp: number;
  };
}

export type HealthStatus = "Healthy" | "Degraded" | "Danger";

export interface PredictionResult {
  status: HealthStatus;
  confidence: number;
  probabilities: Record<HealthStatus, number>;
  perModel: {
    randomForest: Record<HealthStatus, number>;
    knn: Record<HealthStatus, number>;
    logisticRegression: Record<HealthStatus, number>;
  };
}

export interface SensorReadingWithPrediction {
  reading: SensorReading;
  prediction: PredictionResult;
}

export interface HistoryEntry extends SensorReading {
  id?: string;
  prediction?: PredictionResult;
}

<div style="text-align: center; margin-top: 100px;">

# 🔧 BearingPulse

## Bearing Health Prediction System

### Complete Project Documentation

**Version 2.0 — Motor-Agnostic Mode**

---

*A real-time IoT-based predictive maintenance system that uses ESP32 microcontroller, vibration & temperature sensors, Firebase cloud database, and a Machine Learning ensemble to predict bearing health.*

---

**Author:** BearingPulse Team

**Date:** March 2026

</div>

<div style="page-break-after: always;"></div>

# Table of Contents

1. [Project Overview](#1-project-overview)
2. [What Problem Does This Solve?](#2-what-problem-does-this-solve)
3. [System Architecture](#3-system-architecture)
4. [Hardware Setup](#4-hardware-setup)
5. [Sensor Details](#5-sensor-details)
6. [ESP32 Firmware — How It Works](#6-esp32-firmware--how-it-works)
7. [Signal Processing — FFT Explained](#7-signal-processing--fft-explained)
8. [Feature Engineering — The 6 Normalized Features](#8-feature-engineering--the-6-normalized-features)
9. [Calibration System](#9-calibration-system)
10. [Firebase Cloud Database](#10-firebase-cloud-database)
11. [Machine Learning Engine](#11-machine-learning-engine)
12. [Web Dashboard (Next.js)](#12-web-dashboard-nextjs)
13. [API Endpoints](#13-api-endpoints)
14. [Dataset Details](#14-dataset-details)
15. [Complete Data Flow — End to End](#15-complete-data-flow--end-to-end)
16. [How to Run the Project](#16-how-to-run-the-project)
17. [File Structure](#17-file-structure)
18. [Glossary](#18-glossary)

<div style="page-break-after: always;"></div>

---

# 1. Project Overview

**BearingPulse** is a complete **Predictive Maintenance System** for monitoring the health of bearings in motors and rotating machinery.

### What does it do?

It collects **vibration** and **temperature** data from sensors attached to a motor, sends that data to the **cloud (Firebase)**, runs a **Machine Learning model** on it, and tells you whether the bearing is:

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| ✅ **Healthy** | Bearing is operating normally | No action needed |
| ⚠️ **Degraded** | Early signs of wear detected | Schedule maintenance soon |
| 🚨 **Danger** | Bearing is about to fail | Immediate attention required |

### Key Features

- **Real-time monitoring** — Data refreshes every 60 seconds
- **Motor-agnostic** — Works with ANY motor (no hardcoded thresholds)
- **ML-powered predictions** — Uses 3 ML models combined (ensemble)
- **Beautiful dashboard** — Dark-themed, glassmorphic web UI
- **Cloud-connected** — Data stored in Firebase Realtime Database
- **Calibration system** — Auto-learns what "healthy" looks like for your motor

---

# 2. What Problem Does This Solve?

## The Problem: Unexpected Bearing Failures

Bearings are found in almost every rotating machine — fans, motors, pumps, turbines, etc. When a bearing fails:

- **Production stops** (costly downtime)
- **Equipment gets damaged** (expensive repairs)
- **Safety hazards** (flying parts, fires)

Traditional approach: **Wait until it breaks, then fix it** (reactive maintenance).

## The Solution: Predictive Maintenance

BearingPulse detects problems **BEFORE** the bearing fails by analyzing:

1. **Vibration patterns** — A damaged bearing vibrates differently
2. **Temperature changes** — A failing bearing gets hotter
3. **Frequency signatures** — Specific defects produce specific frequency patterns

> **Think of it like a doctor's check-up for your motor.** Instead of waiting for the motor to "get sick" (break down), we constantly monitor its "vital signs" (vibration, temperature) and predict when it might need treatment (maintenance).

<div style="page-break-after: always;"></div>

---

# 3. System Architecture

The system has **5 main stages** that work together like a pipeline:

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   SENSORS    │───▶│    ESP32     │───▶│   FIREBASE   │───▶│   ML MODEL   │───▶│  DASHBOARD   │
│ MPU6050 +    │    │ Normalize   │    │ Cloud        │    │ RF + KNN +   │    │ Real-time    │
│ DS18B20      │    │ + FFT       │    │ Database     │    │ LR Ensemble  │    │ Web UI       │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
     STAGE 1            STAGE 2            STAGE 3            STAGE 4            STAGE 5
 Data Collection    Processing &        Cloud Storage     Health Prediction    Visualization
                    Normalization
```

### How data flows:

1. **Sensors** read raw vibration (acceleration in m/s²) and temperature (°C) from the motor
2. **ESP32** processes the raw data — removes gravity, runs FFT, computes 6 normalized features
3. **Firebase** stores the processed data in the cloud
4. **ML Model** (running on the web server) reads the data and predicts health status
5. **Dashboard** displays everything in a beautiful real-time web interface

---

# 4. Hardware Setup

## Components Required

| Component | Purpose | Approximate Cost |
|-----------|---------|-----------------|
| **ESP32 DevKit** | Main microcontroller (brain) | ₹500 / $6 |
| **MPU6050** | Accelerometer + Gyroscope (vibration sensor) | ₹150 / $2 |
| **DS18B20** | Digital temperature sensor | ₹100 / $1.50 |
| **4.7kΩ Resistor** | Pull-up resistor for DS18B20 | ₹5 / $0.10 |
| **Breadboard + Wires** | For connecting everything | ₹100 / $1.50 |

## Wiring Diagram

```
ESP32 Pin       →   Component          →   Notes
─────────────────────────────────────────────────────
GPIO 21 (SDA)   →   MPU6050 SDA         I2C Data
GPIO 22 (SCL)   →   MPU6050 SCL         I2C Clock
3.3V            →   MPU6050 VCC         Power
GND             →   MPU6050 GND         Ground

GPIO 4          →   DS18B20 DATA        One-Wire data pin
3.3V            →   DS18B20 VCC         Power
GND             →   DS18B20 GND         Ground
                    4.7kΩ resistor between DATA and VCC (pull-up)
```

### How to mount sensors:

- **MPU6050**: Mount it firmly on the motor housing, as close to the bearing as possible. It must be rigidly attached (use bolts or strong adhesive — NOT tape!).
- **DS18B20**: Place it touching the bearing housing or motor casing to measure bearing temperature.

<div style="page-break-after: always;"></div>

---

# 5. Sensor Details

## MPU6050 — Accelerometer & Gyroscope

The MPU6050 is a 6-axis motion sensor. In this project, we use the **accelerometer** to measure vibration.

### What does it measure?

- **Acceleration** in 3 axes: X, Y, Z (in m/s²)
- When a bearing vibrates, the acceleration changes rapidly
- A healthy bearing produces smooth, low-amplitude vibrations
- A damaged bearing produces sharp, irregular vibrations

### Configuration in BearingPulse:

| Setting | Value | Why |
|---------|-------|-----|
| Accelerometer Range | ±8g | Captures both gentle and strong vibrations |
| Gyroscope Range | ±500°/s | Available but not primary for bearing analysis |
| Digital Low-Pass Filter | 20 Hz bandwidth | Reduces electrical noise |
| I2C Clock | 400 kHz (Fast mode) | Needed for 1000 Hz sampling rate |

### How raw data becomes m/s² (unit conversion):

```
Raw Value from sensor (16-bit integer, e.g., 4096)

Step 1: Convert to g-force
    acceleration_g = raw_value / 4096.0
    (4096 is the sensitivity at ±8g range)

Step 2: Convert to m/s²
    acceleration_ms2 = acceleration_g × 9.81

Example:
    Raw value = 4096
    → 4096 / 4096.0 = 1.0g
    → 1.0 × 9.81 = 9.81 m/s²  (this is 1g — normal gravity!)
```

## DS18B20 — Digital Temperature Sensor

| Property | Value |
|----------|-------|
| Temperature Range | -55°C to +125°C |
| Accuracy | ±0.5°C |
| Protocol | One-Wire (single data pin) |
| Resolution | 12-bit (0.0625°C steps) |

If the DS18B20 disconnects, the system falls back to the MPU6050's built-in temperature sensor (less accurate but better than nothing):
```
fallback_temp = (mpu_raw_temp / 340.0) + 36.53
```

<div style="page-break-after: always;"></div>

---

# 6. ESP32 Firmware — How It Works

The firmware file is `firmware/BearingPulse.ino`. Here's exactly what happens every **5 seconds** (configurable):

## Step-by-Step Data Collection Cycle

### Step 1: Collect 256 Raw Samples (≈0.256 seconds)

The ESP32 reads acceleration 256 times at 1000 Hz (1000 readings per second).

```
Sampling Rate:    1000 Hz (1 sample every 1 millisecond)
Number of Samples: 256
Total Time:       256 / 1000 = 0.256 seconds of vibration data
```

For each sample, we read X, Y, Z acceleration and convert to m/s²:
```
ax = (raw_ax / 4096.0) × 9.81    → X-axis in m/s²
ay = (raw_ay / 4096.0) × 9.81    → Y-axis in m/s²
az = (raw_az / 4096.0) × 9.81    → Z-axis in m/s²
```

### Step 2: Remove Gravity (Adaptive High-Pass Filter)

**Problem:** The accelerometer always reads ~9.81 m/s² due to Earth's gravity, even when the motor is perfectly still. We need to remove this to isolate the vibration.

**Solution:** Exponential Moving Average (EMA) gravity estimation.

```
How EMA works (α = 0.30):

    gravity_new = α × gravity_old + (1 - α) × current_mean
    gravity_new = 0.30 × gravity_old + 0.70 × current_mean

This slowly adapts to the "static" component (gravity), so that:
    vibration = raw_reading - gravity_estimate

Example:
    Raw reading:     [0.15, 0.10, 9.95] m/s²  (sensor tilted, gravity mostly on Z)
    Gravity estimate:[0.12, 0.08, 9.82] m/s²
    Vibration:       [0.03, 0.02, 0.13] m/s²  ← pure vibration!
```

### Step 3: Compute Vibration Features

After removing gravity, we compute:

**RMS (Root Mean Square) Vibration:**
```
RMS = √( (Σ(vib_x² + vib_y² + vib_z²)) / (N × 3) )

where N = 256 samples

Example:
    If vibration values for one sample: [0.03, 0.02, 0.13]
    Sum of squares: 0.03² + 0.02² + 0.13² = 0.0009 + 0.0004 + 0.0169 = 0.0182
    After 256 samples, total sum = 4.6592
    RMS = √(4.6592 / (256 × 3)) = √(0.00607) = 0.0779 m/s²
```

**Peak Acceleration:**
```
Peak = maximum single-axis vibration across all 256 samples

Example: If the highest single-axis vibration was 0.45 m/s² on Z-axis
    Peak (in m/s²) = 0.45
    Peak (in g)    = 0.45 / 9.81 = 0.046g
```

### Step 4: Compute Kurtosis

Kurtosis measures the "spikiness" of the vibration signal. Sharp impulses (from bearing defects) produce high kurtosis.

```
Kurtosis Formula:
    kurtosis = E[(X - μ)⁴] / σ⁴

Step 1: Compute mean (μ) of vibration magnitudes
    μ = Σ(magnitude_i) / N

Step 2: Compute variance (σ²)
    σ² = E[X²] - μ²

Step 3: Compute 4th central moment
    m₄ = Σ((magnitude_i - μ)⁴) / N

Step 4: Compute kurtosis
    kurtosis = m₄ / σ⁴

Interpreting kurtosis:
    kurtosis ≈ 3.0  → Normal distribution (healthy bearing)
    kurtosis > 5.0  → Spiky signal (early damage)
    kurtosis > 10.0 → Very impulsive (severe damage)

Example (Healthy):
    Vibration magnitudes: [0.08, 0.07, 0.09, 0.08, 0.07, ...]  (smooth)
    μ = 0.078, σ = 0.008
    kurtosis ≈ 2.9 (close to normal — healthy!)

Example (Damaged):
    Vibration magnitudes: [0.05, 0.04, 0.95, 0.06, 0.03, ...]  (spike!)
    μ = 0.08, σ = 0.15
    kurtosis ≈ 14.5 (very spiky — bearing defect!)
```

### Step 5: Read Temperature

```
tempSensor.requestTemperatures();
rawTemp = tempSensor.getTempCByIndex(0);  // Read DS18B20 in °C
```

### Step 6: Compute Normalized Features & Send to Firebase

See Section 8 for feature calculations and Section 10 for Firebase data format.

<div style="page-break-after: always;"></div>

---

---

# 7. Feature Engineering — The 4 Normalized Features

The key innovation of BearingPulse is that it uses **normalized, motor-agnostic features**. This means the system works with ANY motor — a small desk fan or a large industrial pump — without changing any code.

## How? Baseline Normalization

During calibration (described in Section 8), the system records baseline values for a **healthy** motor:
- `baseline_rms` — How much a healthy motor vibrates
- `baseline_temp` — Normal operating temperature

All features are then expressed **relative to these baselines**.

## The 4 Features Explained

### Feature 1: `rms_norm` (Normalized RMS Vibration)

```
Formula: rms_norm = current_RMS / baseline_RMS

What it means:
    1.0  → Same vibration as healthy baseline
    1.5  → 50% more vibration than normal
    3.0  → 3× more vibration than normal (concerning!)

Example:
    baseline_rms = 0.05 m/s² (measured during calibration)
    current_rms  = 0.15 m/s² (current reading)
    rms_norm = 0.15 / 0.05 = 3.0×  (3 times normal — possible problem!)

Thresholds on dashboard:
    < 1.2×  → Green (Healthy)
    1.2-1.8× → Yellow (Warning)
    > 1.8×  → Red (Danger)
```

### Feature 2: `crest_factor` (Peak-to-RMS Ratio)

```
Formula: crest_factor = peak_acceleration / (RMS + 0.001)

    The 0.001 prevents division by zero.

What it means:
    < 4.0  → Smooth vibration (healthy)
    4.0-6.0 → Some impact events (early wear)
    > 6.0  → Sharp impacts (bearing damage)

Why it's useful:
    A healthy bearing has smooth vibration → low crest factor
    A damaged bearing has sharp spikes → high crest factor

Example (Healthy):
    Peak = 0.15 m/s², RMS = 0.05 m/s²
    crest_factor = 0.15 / 0.051 = 2.94

Example (Damaged):
    Peak = 0.90 m/s², RMS = 0.12 m/s²
    crest_factor = 0.90 / 0.121 = 7.44 (high! — impact events detected)
```

### Feature 3: `kurtosis` (Signal Spikiness)

```
Formula: kurtosis = E[(X-μ)⁴] / σ⁴

What it means:
    ≈ 3.0  → Normal/Gaussian distribution (healthy)
    5.0-10.0 → Moderate spikiness (early defect)
    > 10.0  → Very impulsive (severe damage)

This feature is SCALE-INDEPENDENT — it doesn't need baseline normalization!
A value of 3.0 means "normal" regardless of whether the motor vibrates a lot or a little.
```

### Feature 4: `temperature_delta` (Temperature Rise)

```
Formula: temperature_delta = current_temperature - baseline_temperature

What it means:
    0-5°C   → Normal temperature variation
    10-15°C → Above normal (increased friction = wear)
    > 25°C  → Dangerously hot (imminent failure)

Example:
    baseline_temp = 35.0°C (measured during calibration)
    current_temp  = 48.5°C
    temperature_delta = 48.5 - 35.0 = 13.5°C (above normal!)
```

## Summary Table — All 4 Features

| # | Feature | Formula | Healthy Range | Degraded Range | Danger Range | Unit |
|---|---------|---------|---------------|----------------|--------------|------|
| 1 | `rms_norm` | RMS / baseline_RMS | 0.7 – 1.2 | 1.2 – 1.8 | > 1.8 | × (times) |
| 2 | `crest_factor` | Peak / RMS | 2.0 – 4.0 | 4.0 – 6.0 | > 6.0 | ratio |
| 3 | `kurtosis` | 4th moment / σ⁴ | 2.0 – 5.0 | 5.0 – 10.0 | > 10.0 | dimensionless |
| 4 | `temperature_delta` | Temp − baseline | 0 – 5°C | 5 – 15°C | > 25°C | °C |

<div style="page-break-after: always;"></div>

---

# 8. Calibration System

## What is Calibration?

Calibration teaches the system what "healthy" looks like for YOUR specific motor. Since every motor vibrates differently, we need to measure the baseline values when the motor is running normally.

## How to Calibrate

1. Make sure the motor is running in a **known healthy state**
2. Open the Arduino Serial Monitor (115200 baud)
3. Type `CAL` and press Enter
4. Wait 30 seconds while the system collects 30 samples
5. Baseline values are automatically saved to ESP32's NVS (Non-Volatile Storage)

## What Happens During Calibration

```
For 30 seconds (1 sample per second):
    1. Read acceleration → compute RMS
    2. Read temperature
    3. Accumulate totals

After 30 samples:
    baseline_rms  = average_of_all_RMS_values
    baseline_temp = average_of_all_temperatures

These are saved to NVS (persistent across reboots).
```

## NVS Storage (Non-Volatile Storage)

NVS is the ESP32's built-in flash memory that persists across power cycles:
```
preferences.putFloat("rms",  baseline_rms);   // Saved permanently
preferences.putFloat("temp", baseline_temp);   // Survives reboot
preferences.putBool("valid", true);            // Marks calibration as done
```

Baselines are also uploaded to Firebase at `bearingpulse/baselines/ESP32_001` for reference.

<div style="page-break-after: always;"></div>

---

# 9. Firebase Cloud Database

## What is Firebase?

Firebase Realtime Database is a cloud-hosted NoSQL database by Google. Data is stored as JSON and synced in real-time.

## Database Structure

```
bearingpulse/
├── readings/                    ← Sensor data (auto-generated keys)
│   ├── -NxyzABC123/
│   │   ├── rms_norm: 1.05
│   │   ├── crest_factor: 3.2
│   │   ├── kurtosis: 2.95
│   │   ├── temperature_delta: 1.5
│   │   ├── timestamp: 1711900000000
│   │   ├── device_id: "ESP32_001"
│   │   └── raw/
│   │       ├── rms: 0.052
│   │       ├── peak: 0.043
│   │       └── temp: 36.5
│   └── -NxyzDEF456/
│       └── ...
│
└── baselines/                   ← Calibration reference values
    └── ESP32_001/
        ├── baseline_rms: 0.05
        ├── baseline_temp: 35.0
        ├── device_id: "ESP32_001"
        └── calibrated_at: 45000
```

## How ESP32 Sends Data

The ESP32 sends an HTTPS POST request to Firebase:
```
URL: https://bearingpulse-default-rtdb.asia-southeast1.firebasedatabase.app
     /bearingpulse/readings.json?auth=<API_KEY>

Method: POST (creates new entry with auto-generated key)

Body (JSON):
{
    "rms_norm": 1.05,
    "crest_factor": 3.2,
    "kurtosis": 2.95,
    "temperature_delta": 1.5,
    "timestamp": 1711900000000,
    "device_id": "ESP32_001",
    "raw": {
        "rms": 0.052,
        "peak": 0.043,
        "temp": 36.5
    }
}
```

## How Dashboard Reads Data

The Next.js web app queries Firebase using the Firebase SDK:
```
Query: Get the last 1 reading, ordered by timestamp
Path:  bearingpulse/readings
       → orderByChild("timestamp")
       → limitToLast(1)
```

<div style="page-break-after: always;"></div>

---

# 10. Machine Learning Engine

## Overview

BearingPulse uses a **Weighted Ensemble** of 3 different ML models. Each model "votes" on the health status, and their votes are combined using weights.

```
Final_Prediction = 0.50 × Random Forest
                 + 0.25 × KNN
                 + 0.25 × Logistic Regression
```

## Why 3 Models? (Ensemble Learning)

Each model has different strengths:

| Model | Strength | Weakness |
|-------|----------|----------|
| **Random Forest** | Handles non-linear patterns, robust | Can overfit |
| **KNN** | Simple, good with clusters | Slow with large data |
| **Logistic Regression** | Fast, gives true probabilities | Assumes linearity |

By combining all three, we get a prediction that's more reliable than any single model.

## Model Details

### Model 1: Random Forest Classifier (Weight: 50%)

```
Configuration:
    Number of trees (nEstimators): 50
    Max features per split: 70% of features (3 out of 4)
    Bagging: Yes (each tree sees a random subset of data)
    Random seed: 42 (for reproducibility)

How it works:
    1. Build 50 decision trees, each trained on a random subset of data
    2. Each tree votes for a class (Healthy/Degraded/Danger)
    3. Count votes → convert to probabilities

Example prediction:
    Tree 1: Healthy    Tree 2: Healthy    Tree 3: Degraded
    Tree 4: Healthy    Tree 5: Healthy    ... (50 trees total)

    Votes: Healthy=38, Degraded=10, Danger=2
    Probabilities: [38/50, 10/50, 2/50] = [0.76, 0.20, 0.04]
```

### Model 2: K-Nearest Neighbors (Weight: 25%)

```
Configuration:
    K = 7 (look at 7 nearest neighbors)

How it works:
    1. For a new reading, find the 7 most similar readings in training data
    2. Whatever class the majority of those 7 belong to → that's the prediction

Example:
    New reading: rms_norm=1.8, crest_factor=5.1, kurtosis=6.2, ...
    7 nearest neighbors: [Degraded, Degraded, Healthy, Degraded,
                          Degraded, Degraded, Danger]
    Prediction: Degraded (5 out of 7)

    Since KNN gives only a class (not probabilities), we create
    pseudo-probabilities: predicted class gets 85%, rest split equally.
    → [0.075, 0.85, 0.075]  (if Degraded is predicted)
```

### Model 3: Logistic Regression — One-vs-Rest (Weight: 25%)

```
Configuration:
    Learning rate: 0.1
    Epochs: 300
    Strategy: One-vs-Rest (3 binary classifiers)

How One-vs-Rest works:
    Classifier 1: "Is it Healthy or not?"    → probability P₁
    Classifier 2: "Is it Degraded or not?"   → probability P₂
    Classifier 3: "Is it Danger or not?"     → probability P₃

    Normalize: [P₁/(P₁+P₂+P₃), P₂/(P₁+P₂+P₃), P₃/(P₁+P₂+P₃)]

Each binary classifier uses the sigmoid function:
    sigmoid(z) = 1 / (1 + e^(-z))

    where z = w₁×feature₁ + w₂×feature₂ + ... + w₄×feature₄ + bias

    Gradient descent updates:
        weight_j -= learning_rate × (1/n) × Σ(predicted - actual) × feature_j
        bias     -= learning_rate × (1/n) × Σ(predicted - actual)
```

## Feature Scaling (StandardScaler)

Before training, all features are scaled to have **mean=0** and **standard deviation=1**:

```
scaled_value = (original_value - mean) / standard_deviation

Example for rms_norm:
    Training data mean:  1.85
    Training data std:   1.42

    If rms_norm = 3.0:
    scaled = (3.0 - 1.85) / 1.42 = 0.81

Why scale? Because KNN and Logistic Regression are sensitive to feature
magnitudes. Without scaling, a feature like temperature_delta (0-50)
would dominate over kurtosis (2-18).
```

## Ensemble Combination — Worked Example

```
Input reading:
    rms_norm=2.3, crest_factor=4.7, kurtosis=6.5,
    temperature_delta=17.1

Step 1: Scale features using training data statistics
Step 2: Get predictions from each model:

    Random Forest:          [0.05, 0.82, 0.13]  (Healthy, Degraded, Danger)
    KNN (predicted class 1):[0.075, 0.85, 0.075]
    Logistic Regression:    [0.10, 0.75, 0.15]

Step 3: Weighted combination:
    Healthy  = 0.50×0.05  + 0.25×0.075  + 0.25×0.10  = 0.025 + 0.019 + 0.025  = 0.069
    Degraded = 0.50×0.82  + 0.25×0.85   + 0.25×0.75  = 0.410 + 0.213 + 0.188  = 0.810
    Danger   = 0.50×0.13  + 0.25×0.075  + 0.25×0.15  = 0.065 + 0.019 + 0.038  = 0.121

Step 4: Normalize (sum = 1.0):
    Total = 0.069 + 0.810 + 0.121 = 1.000 ✓

Step 5: Final result:
    Status:     DEGRADED
    Confidence: 81.0%
    Probabilities: { Healthy: 6.9%, Degraded: 81.0%, Danger: 12.1% }
```

<div style="page-break-after: always;"></div>

---

# 11. Web Dashboard (Next.js)

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2 | React framework (server + client) |
| React | 18.2 | UI component library |
| Recharts | 2.12 | Charts and data visualization |
| Tailwind CSS | 4 | Utility-first CSS framework |
| Firebase SDK | 10.14 | Cloud database connection |
| TypeScript | 5.3 | Type-safe JavaScript |

## Dashboard Components

### 1. `Dashboard.tsx` — Main Container

The brain of the UI. It manages:
- **State**: Current reading, prediction, history, live mode
- **Polling**: Fetches new data from Firebase every 60 seconds (when live)
- **Prediction**: Sends readings to `/api/predict` for ML analysis

### 2. `HealthGauge.tsx` — Circular Health Indicator

A circular SVG gauge showing:
- Health status (Healthy / Degraded / Danger)
- Confidence percentage
- Color-coded: Green / Yellow / Red

### 3. `SensorCard.tsx` — Individual Feature Display

Four cards showing real-time feature values with:
- Color-coded status (green/yellow/red based on thresholds)
- Animated progress bars
- Numerical value with unit

### 4. `TrendChart.tsx` — Historical Line Chart

Shows trends over time for:
- RMS Norm (cyan line)
- Crest Factor (purple line)
- Temperature Delta (red line)

### 5. `SystemFlow.tsx` — Architecture Diagram

Visual pipeline: Sensors → ESP32 → Firebase → ML Model → Dashboard
Shows live/idle status with animations.

## Design System

- **Theme**: Dark navy background (#0a0e27) with cyan accents (#00f0ff)
- **Cards**: Glassmorphism effect (semi-transparent + blur)
- **Fonts**: Inter (UI text) + JetBrains Mono (numbers/code)
- **Animations**: Fade-in, pulse, glow, float effects

<div style="page-break-after: always;"></div>

---

# 12. API Endpoints

The Next.js server exposes 3 API routes:

## GET `/api/readings`

Fetches sensor readings from Firebase.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `mode` | string | `"history"` | `"latest"` for most recent, `"history"` for multiple |
| `limit` | number | `50` | Number of historical readings to fetch |

```
GET /api/readings?mode=latest
Response: { "success": true, "reading": { "rms_norm": 1.05, ... } }

GET /api/readings?mode=history&limit=20
Response: { "success": true, "readings": [...], "count": 20 }
```

## POST `/api/predict`

Runs the ML ensemble on a sensor reading.

```
POST /api/predict
Body: {
    "rms_norm": 1.05,
    "crest_factor": 3.2,
    "kurtosis": 2.95,
    "temperature_delta": 1.5
}

Response: {
    "success": true,
    "prediction": {
        "status": "Healthy",
        "confidence": 0.94,
        "probabilities": { "Healthy": 0.94, "Degraded": 0.04, "Danger": 0.02 },
        "perModel": {
            "randomForest": { "Healthy": 0.92, ... },
            "knn": { "Healthy": 0.85, ... },
            "logisticRegression": { "Healthy": 0.97, ... }
        }
    }
}
```

## GET `/api/health`

Simple health check endpoint.
```
Response: { "status": "ok", "service": "BearingPulse API", "timestamp": "..." }
```

<div style="page-break-after: always;"></div>

---

# 13. Dataset Details

## File: `data/bearing_health_dataset.csv`

The ML models are trained on a CSV dataset containing **5,000 samples** with 4 features and 1 label.

## Dataset Statistics

| Column | Min | Max | Description |
|--------|-----|-----|-------------|
| `rms_norm` | ~0.7 | ~7.7 | Normalized vibration RMS |
| `crest_factor` | ~2.0 | ~10.2 | Peak-to-RMS ratio |
| `kurtosis` | ~2.0 | ~18.5 | Signal spikiness |
| `temperature_delta` | 0.0 | ~49.0 | Temperature rise (°C) |

## Class Distribution (approximate)

| Class | Count | Percentage |
|-------|-------|------------|
| Healthy | ~3,000 | ~60% |
| Degraded | ~1,200 | ~24% |
| Danger | ~800 | ~16% |

## Sample Data Rows

```
Healthy example:
    rms_norm=0.99, crest_factor=3.1, kurtosis=2.55,
    temperature_delta=0.42

Degraded example:
    rms_norm=2.31, crest_factor=4.71, kurtosis=6.56,
    temperature_delta=17.08

Danger example:
    rms_norm=5.93, crest_factor=5.34, kurtosis=14.12,
    temperature_delta=28.64
```

<div style="page-break-after: always;"></div>

---

# 14. Complete Data Flow — End to End

Here's exactly what happens from sensor reading to dashboard display:

```
SECOND 0: ESP32 starts a new cycle
    │
    ▼
SECOND 0-0.256: Collect 256 accelerometer samples at 1000 Hz
    │  → Store raw X, Y, Z values
    │  → Compute sum for gravity update
    │
    ▼
SECOND 0.256: Process vibration data
    │  → Update gravity estimate (EMA filter)
    │  → Subtract gravity from each sample
    │  → Compute RMS, Peak, Kurtosis
    │
    ▼
SECOND 0.3: Read temperature from DS18B20
    │
    ▼
SECOND 0.3: Compute 4 normalized features
    │  rms_norm = rawRms / baseline_rms
    │  crest_factor = rawPeak / (rawRms + 0.001)
    │  kurtosis = m4 / (variance²)
    │  temperature_delta = rawTemp - baseline_temp
    │
    ▼
SECOND 0.5: Send JSON to Firebase via HTTPS POST
    │  → POST to bearingpulse/readings.json
    │  → Data appears in cloud database instantly
    │
    ▼
WAIT until 5 seconds have passed, then repeat
    │
    ═══════════════════════════════════════════
    │
MEANWHILE, on the Web Dashboard:
    │
    ▼
EVERY 60 SECONDS (when "LIVE" toggle is on):
    │
    ▼
Fetch latest reading from Firebase
    │  → GET /api/readings?mode=latest
    │  → Firebase query: orderByChild("timestamp"), limitToLast(1)
    │
    ▼
Send reading to ML prediction endpoint
    │  → POST /api/predict with the 4 features
    │  → Server loads trained models (cached after first call)
    │  → Scale features using StandardScaler
    │  → Get probabilities from RF, KNN, LR
    │  → Combine with weights: 50/25/25
    │  → Return: { status, confidence, probabilities }
    │
    ▼
Update Dashboard UI
    │  → Health Gauge shows status color + confidence %
    │  → 4 Sensor Cards show current feature values
    │  → Trend Chart adds point to history
    │  → System Flow shows pipeline status
```

<div style="page-break-after: always;"></div>

---

# 15. How to Run the Project

## Prerequisites

- **Node.js** v18 or later
- **Arduino IDE** with ESP32 board support
- **Firebase account** (free tier is sufficient)

## Step 1: Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project named "bearingpulse"
3. Enable **Realtime Database** (Asia Southeast region)
4. Set database rules to allow read/write (for development)
5. Copy your Firebase config values

## Step 2: Flash the ESP32

1. Open `firmware/BearingPulse.ino` in Arduino IDE
2. Install these libraries via Library Manager:
   - `ArduinoJson`
   - `I2Cdev` + `MPU6050`
   - `OneWire` + `DallasTemperature`
   - `arduinoFFT`
3. Update WiFi credentials and Firebase host/key in the code
4. Select your ESP32 board and upload
5. Open Serial Monitor at 115200 baud
6. Type `CAL` to calibrate (motor must be running healthy)

## Step 3: Run the Web Dashboard

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local with your Firebase config
# (copy from Firebase Console → Project Settings → Web App)

# 3. Start the development server
npm run dev

# 4. Open in browser
# http://localhost:3000
```

## Step 4: Go Live

1. Toggle the **LIVE** button on the dashboard
2. The system will fetch new data every 60 seconds
3. Watch the health gauge and sensor cards update in real-time

---

# 17. File Structure

```
BearingPulse/
│
├── firmware/
│   └── BearingPulse.ino          ← ESP32 firmware (sensor + FFT + Firebase upload)
│
├── data/
│   └── bearing_health_dataset.csv ← 5,000 sample training dataset
│
├── src/
│   ├── app/
│   │   ├── layout.tsx             ← Root HTML layout with metadata
│   │   ├── page.tsx               ← Home page (renders Dashboard)
│   │   ├── globals.css            ← Global styles, themes, animations
│   │   └── api/
│   │       ├── health/route.ts    ← GET  /api/health — health check
│   │       ├── readings/route.ts  ← GET  /api/readings — fetch from Firebase
│   │       └── predict/route.ts   ← POST /api/predict — ML prediction
│   │
│   ├── components/
│   │   ├── Dashboard.tsx          ← Main dashboard (state management, polling)
│   │   ├── HealthGauge.tsx        ← Circular SVG health indicator
│   │   ├── SensorCard.tsx         ← Individual feature display card
│   │   ├── TrendChart.tsx         ← Line chart for historical trends
│   │   ├── PredictionPanel.tsx    ← Ensemble breakdown bars
│   │   └── SystemFlow.tsx         ← Architecture pipeline diagram
│   │
│   ├── lib/
│   │   ├── firebase.ts            ← Firebase SDK init + database helpers
│   │   ├── types.ts               ← Shared TypeScript interfaces
│   │   └── ml/
│   │       ├── types.ts           ← ML type defs, weights, label maps
│   │       ├── data.ts            ← CSV dataset loader + shuffler
│   │       ├── train.ts           ← Model training (KNN, RF, LR) + scaler
│   │       └── ensemble.ts        ← Weighted ensemble prediction engine
│   │
│   └── types/
│       └── ml.d.ts                ← TypeScript declarations for ML libraries
│
├── .env.local                     ← Firebase credentials (secret, not in git)
├── package.json                   ← Dependencies and scripts
├── tailwind.config.ts             ← Tailwind CSS theme configuration
├── tsconfig.json                  ← TypeScript configuration
├── next.config.ts                 ← Next.js configuration
└── postcss.config.js              ← PostCSS configuration
```

<div style="page-break-after: always;"></div>

---

# 17. Glossary

| Term | Definition |
|------|-----------|
| **Bearing** | A mechanical component that constrains relative motion and reduces friction between moving parts |
| **Predictive Maintenance** | Using data and ML to predict when equipment will fail, so maintenance can be scheduled proactively |
| **RMS** | Root Mean Square — a statistical measure of the magnitude of a varying quantity |
| **Kurtosis** | A statistical measure of the "tailedness" or "spikiness" of a probability distribution |
| **Crest Factor** | The ratio of peak value to RMS value of a waveform |
| **Baseline** | Reference values measured when the system is known to be in a healthy state |
| **Motor-Agnostic** | The system works with any motor without needing motor-specific configuration |
| **Ensemble** | Combining predictions from multiple ML models for better accuracy |
| **Random Forest** | An ML algorithm that builds many decision trees and averages their predictions |
| **KNN** | K-Nearest Neighbors — classifies based on the K most similar examples |
| **Logistic Regression** | A statistical model that uses a logistic function to predict probabilities |
| **One-vs-Rest (OVR)** | A strategy for multiclass classification using binary classifiers |
| **StandardScaler** | Transforms features to have zero mean and unit variance |
| **EMA** | Exponential Moving Average — a type of weighted moving average |
| **NVS** | Non-Volatile Storage — ESP32's flash memory that persists across reboots |
| **Firebase RTDB** | Firebase Realtime Database — a cloud-hosted NoSQL database |

| **I2C** | Inter-Integrated Circuit — a communication protocol for connecting sensors |
| **One-Wire** | A communication protocol used by DS18B20 temperature sensor |
| **Glassmorphism** | A UI design trend using frosted-glass-like translucent elements |

---

*End of Documentation*

*BearingPulse v2.0 — Motor-Agnostic Bearing Health Prediction System*

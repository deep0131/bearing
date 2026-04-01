#include <WiFi.h>
#include <WiFiClientSecure.h> // ESP32 core needs this for HTTPS
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <I2Cdev.h>
#include <MPU6050.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <math.h>
#include <Preferences.h>  // ESP32 NVS for baseline storage

// ─── CONFIGURATION ─── (UPDATE THESE)
const char* WIFI_SSID     = "DeepY";
const char* WIFI_PASSWORD = "deep3101";

// Firebase Realtime Database
const char* FIREBASE_HOST = "bearingpulse-default-rtdb.asia-southeast1.firebasedatabase.app";
const char* FIREBASE_API_KEY = "1KYvctu4vwGrcuYWJR4W78TcBB4eafsfUSGbZbej";

const char* DEVICE_ID = "ESP32_001";

// ─── PIN DEFINITIONS ───
#define ONE_WIRE_BUS 4       // DS18B20 data pin

// ─── FFT CONFIGURATION ───
#define SAMPLES 256
#define SAMPLING_FREQUENCY 1000  // Hz

// ─── OBJECTS ───
MPU6050 mpu;
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensor(&oneWire);
Preferences preferences;

double vib_magnitudes[SAMPLES];

// ─── TIMING ───
unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 5000;  // 60 seconds

// ─── BASELINE VALUES (motor-agnostic normalization) ───
float baseline_rms  = 1.0;
float baseline_temp = 30.0;
bool  baselineValid = false;

// ─── CALIBRATION ───
#define CALIBRATION_DURATION 30000  // 30 seconds of data collection
#define CALIBRATION_SAMPLES  30     // collect 30 readings (one per second)

// ─── GRAVITY OFFSET (adaptive high-pass filter) ───
float gravity_x = 0.0;
float gravity_y = 0.0;
float gravity_z = 9.81;  // default: sensor flat, gravity on Z
bool  gravityInitialized = false;

// Alpha for gravity EMA: lower = faster adaptation
// 0.30 means ~97% corrected in 3 readings (15 seconds at 5s interval)
const float GRAVITY_ALPHA = 0.30;

// Initial gravity estimation (fast, at startup)
void estimateGravity() {
  Serial.print("🌍 Estimating initial gravity offset");
  float sx = 0, sy = 0, sz = 0;
  const int N = 100;
  for (int i = 0; i < N; i++) {
    int16_t ax, ay, az;
    mpu.getAcceleration(&ax, &ay, &az);
    sx += (ax / 4096.0) * 9.81;
    sy += (ay / 4096.0) * 9.81;
    sz += (az / 4096.0) * 9.81;
    delay(10);
    if (i % 25 == 0) Serial.print(".");
  }
  gravity_x = sx / N;
  gravity_y = sy / N;
  gravity_z = sz / N;
  gravityInitialized = true;
  Serial.printf(" done (%.2f, %.2f, %.2f)\n", gravity_x, gravity_y, gravity_z);
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n═══════════════════════════════════");
  Serial.println("   BearingPulse — ESP32 Firmware");
  Serial.println("   v2.0 — Motor-Agnostic Mode");
  Serial.println("═══════════════════════════════════");

  // Initialize I2C for MPU6050
  Wire.begin();
  Wire.setClock(400000); // 400kHz I2C required for 1000Hz sampling

  // Configure MPU6050
  mpu.setFullScaleAccelRange(MPU6050_ACCEL_FS_8);
  mpu.setFullScaleGyroRange(MPU6050_GYRO_FS_500);
  mpu.setDLPFMode(MPU6050_DLPF_BW_20);

  delay(500); // Let sensor settle

  // Estimate gravity vector (MUST be done while sensor is stationary!)
  estimateGravity();

  // Initialize DS18B20
  tempSensor.begin();
  Serial.println("✅ DS18B20 initialized");

  // Load baseline from NVS
  preferences.begin("baseline", false);
  baselineValid = preferences.getBool("valid", false);
  if (baselineValid) {
    baseline_rms  = preferences.getFloat("rms", 1.0);
    baseline_temp = preferences.getFloat("temp", 30.0);
    Serial.println("📦 Baseline loaded from NVS:");
    Serial.printf("   RMS: %.4f | Temp: %.1f°C\n", baseline_rms, baseline_temp);
  } else {
    Serial.println("⚠️  No baseline stored. Type CAL in Serial Monitor to calibrate.");
  }

  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("📡 Connecting to WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n❌ WiFi connection failed!");
  }

  Serial.println("💡 Type CAL in Serial Monitor at any time to calibrate.");
}

// ═══════════════════════════════════════
//  CALIBRATION MODE
//  Collects sensor data for 30s and
//  stores average baseline values in NVS
// ═══════════════════════════════════════
void runCalibration() {
  Serial.println("\n🔧 ═══ CALIBRATION MODE ═══");
  Serial.println("   Motor should be running in HEALTHY state!");
  Serial.println("   Collecting data for 30 seconds...\n");

  float sumRms = 0;
  float sumTemp = 0;
  int validSamples = 0;

  for (int s = 0; s < CALIBRATION_SAMPLES; s++) {
    Serial.printf("   Sample %d/%d...\n", s + 1, CALIBRATION_SAMPLES);

    // Read acceleration
    int16_t ax_raw, ay_raw, az_raw;
    int16_t gx_raw, gy_raw, gz_raw;
    mpu.getMotion6(&ax_raw, &ay_raw, &az_raw, &gx_raw, &gy_raw, &gz_raw);

    float ax = (ax_raw / 4096.0) * 9.81 - gravity_x;
    float ay = (ay_raw / 4096.0) * 9.81 - gravity_y;
    float az = (az_raw / 4096.0) * 9.81 - gravity_z;
    float rms = sqrt((ax * ax + ay * ay + az * az) / 3.0);

    // Read temperature
    tempSensor.requestTemperatures();
    float temp = tempSensor.getTempCByIndex(0);
    if (temp == DEVICE_DISCONNECTED_C) {
      temp = (mpu.getTemperature() / 340.0) + 36.53;
    }

    // Delay to simulate the time taken by sampling previously (about 256ms)
    delay(256);

    if (rms > 0.01) {
      sumRms += rms;
      sumTemp += temp;
      validSamples++;
    }

    delay(1000);  // 1 second between samples
  }

  if (validSamples < 5) {
    Serial.println("\n❌ Calibration failed: not enough valid samples.");
    Serial.println("   Check sensor wiring and motor operation.");
    return;
  }

  // Compute baselines
  baseline_rms  = sumRms / validSamples;
  baseline_temp = sumTemp / validSamples;

  // Prevent divide-by-zero
  if (baseline_rms < 0.01)  baseline_rms = 0.01;

  // Store in NVS (persists across reboots)
  preferences.putFloat("rms", baseline_rms);
  preferences.putFloat("temp", baseline_temp);
  preferences.putBool("valid", true);
  baselineValid = true;

  Serial.println("\n✅ ═══ CALIBRATION COMPLETE ═══");
  Serial.printf("   Baseline RMS:  %.4f mm/s\n", baseline_rms);
  Serial.printf("   Baseline Temp: %.1f °C\n", baseline_temp);
  Serial.printf("   Valid samples: %d/%d\n", validSamples, CALIBRATION_SAMPLES);
  Serial.println("   Values saved to NVS (persistent).\n");

  // Also send baseline to Firebase for reference
  if (WiFi.status() == WL_CONNECTED) {
    sendBaselineToFirebase();
  }
}

void sendBaselineToFirebase() {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  String url = "https://";
  url += FIREBASE_HOST;
  url += "/bearingpulse/baselines/";
  url += DEVICE_ID;
  url += ".json?auth=";
  url += FIREBASE_API_KEY;

#if ARDUINOJSON_VERSION_MAJOR >= 7
  JsonDocument doc;
#else
  StaticJsonDocument<256> doc;
#endif

  doc["baseline_rms"]  = baseline_rms;
  doc["baseline_temp"] = baseline_temp;
  doc["device_id"]     = DEVICE_ID;
  doc["calibrated_at"] = millis();

  String payload;
  serializeJson(doc, payload);

  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  int httpCode = http.PUT(payload);

  if (httpCode > 0) {
    Serial.printf("📤 Baseline saved to Firebase: %d\n", httpCode);
  } else {
    Serial.printf("❌ Baseline upload error: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}

void loop() {
  // ── Check for Serial calibration command ──
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    cmd.toUpperCase();
    if (cmd == "CAL" || cmd == "CALIBRATE") {
      runCalibration();
      return;
    }
  }

  unsigned long now = millis();
  if (now - lastSend < SEND_INTERVAL) return;
  lastSend = now;

  // ── Collect 256 samples for FFT + compute all vibration features ──
  unsigned long sampling_period_us = 1000000 / SAMPLING_FREQUENCY;
  
  // Raw per-axis arrays for gravity update
  float raw_ax_arr[SAMPLES];
  float raw_ay_arr[SAMPLES];
  float raw_az_arr[SAMPLES];
  float sum_raw_x = 0, sum_raw_y = 0, sum_raw_z = 0;

  // Step 1: Collect raw samples
  for (int i = 0; i < SAMPLES; i++) {
    unsigned long t = micros();
    int16_t ax_r, ay_r, az_r;
    mpu.getAcceleration(&ax_r, &ay_r, &az_r);
    raw_ax_arr[i] = (ax_r / 4096.0) * 9.81;
    raw_ay_arr[i] = (ay_r / 4096.0) * 9.81;
    raw_az_arr[i] = (az_r / 4096.0) * 9.81;
    sum_raw_x += raw_ax_arr[i];
    sum_raw_y += raw_ay_arr[i];
    sum_raw_z += raw_az_arr[i];
    while ((micros() - t) < sampling_period_us) {}
  }

  // Step 2: Update gravity estimate using window mean (adaptive)
  float window_mean_x = sum_raw_x / SAMPLES;
  float window_mean_y = sum_raw_y / SAMPLES;
  float window_mean_z = sum_raw_z / SAMPLES;
  
  if (gravityInitialized) {
    // Smoothly adapt gravity (EMA)
    gravity_x = GRAVITY_ALPHA * gravity_x + (1.0 - GRAVITY_ALPHA) * window_mean_x;
    gravity_y = GRAVITY_ALPHA * gravity_y + (1.0 - GRAVITY_ALPHA) * window_mean_y;
    gravity_z = GRAVITY_ALPHA * gravity_z + (1.0 - GRAVITY_ALPHA) * window_mean_z;
  } else {
    // First run: set gravity directly
    gravity_x = window_mean_x;
    gravity_y = window_mean_y;
    gravity_z = window_mean_z;
    gravityInitialized = true;
  }

  // Step 3: Subtract gravity, compute vibration features
  double sumAccel = 0;
  double sumAccel2 = 0;
  float maxVibMs2 = 0;  // for peak acceleration
  float vibRmsSum = 0;   // for RMS

  for (int i = 0; i < SAMPLES; i++) {
    float vib_x = raw_ax_arr[i] - gravity_x;
    float vib_y = raw_ay_arr[i] - gravity_y;
    float vib_z = raw_az_arr[i] - gravity_z;
    
    double magnitude = sqrt(vib_x * vib_x + vib_y * vib_y + vib_z * vib_z);
    vib_magnitudes[i] = magnitude;
    
    sumAccel  += magnitude;
    sumAccel2 += magnitude * magnitude;
    
    // Track peak (max of individual axes, in m/s²)
    float axisPeak = max(fabs(vib_x), max(fabs(vib_y), fabs(vib_z)));
    if (axisPeak > maxVibMs2) maxVibMs2 = axisPeak;
    
    // Sum for RMS
    vibRmsSum += (vib_x * vib_x + vib_y * vib_y + vib_z * vib_z);
  }

  // Compute RMS and Peak from the full 256-sample window (much more accurate than single reading)
  float rawRms = sqrt(vibRmsSum / (SAMPLES * 3.0));
  float rawPeakMs2 = maxVibMs2;          // m/s²
  float rawPeak = rawPeakMs2 / 9.81;     // g (for display)

  // ── Read Temperature ──
  tempSensor.requestTemperatures();
  float rawTemp = tempSensor.getTempCByIndex(0);
  if (rawTemp == DEVICE_DISCONNECTED_C) {
    rawTemp = (mpu.getTemperature() / 340.0) + 36.53;
  }

  // ── Compute Kurtosis ──
  double meanAccel = sumAccel / SAMPLES;
  double variance  = (sumAccel2 / SAMPLES) - (meanAccel * meanAccel);
  double stdDev    = sqrt(variance);
  
  // Excess kurtosis (Fisher definition): E[(X-μ)^4]/σ^4 - 3
  // But for bearing monitoring, raw kurtosis (non-excess) is more common
  double kurtosis = 3.0;  // default: normal distribution
  if (stdDev > 0.001) {
    // Compute 4th central moment
    double m4 = 0;
    for (int i = 0; i < SAMPLES; i++) {
      double diff = vib_magnitudes[i] - meanAccel;
      m4 += diff * diff * diff * diff;
    }
    m4 /= SAMPLES;
    kurtosis = m4 / (variance * variance);
  }

  // ═══════════════════════════════════
  //  COMPUTE NORMALIZED FEATURES
  //  (Motor-agnostic, baseline-relative)
  // ═══════════════════════════════════
  
  float rms_norm         = rawRms / baseline_rms;
  float crest_factor     = rawPeakMs2 / (rawRms + 0.001);  // peak/rms (both in m/s²)
  float temperature_delta = rawTemp - baseline_temp;

  // ── Print to Serial ──
  Serial.println("─────────────────────────");
  Serial.println("  Raw Sensor Values:");
  Serial.printf("    RMS Vibration:  %.2f mm/s\n", rawRms);
  Serial.printf("    Peak Accel:     %.2f g\n", rawPeak);
  Serial.printf("    Temperature:    %.1f °C\n", rawTemp);
  Serial.println("  Normalized Features:");
  Serial.printf("    RMS Norm:       %.4f (baseline: %.4f)\n", rms_norm, baseline_rms);
  Serial.printf("    Crest Factor:   %.4f\n", crest_factor);
  Serial.printf("    Kurtosis:       %.4f\n", kurtosis);
  Serial.printf("    Temp Delta:     %.1f °C (baseline: %.1f)\n", temperature_delta, baseline_temp);

  // ── Send to Firebase ──
  if (WiFi.status() == WL_CONNECTED) {
    sendToFirebase(rms_norm, crest_factor, kurtosis, temperature_delta,
                   rawRms, rawPeak, rawTemp);
  } else {
    Serial.println("⚠️  WiFi disconnected, retrying...");
    WiFi.reconnect();
  }
}

void sendToFirebase(float rmsNorm, float crestFactor, float kurt, float tempDelta,
                    float rawRms, float rawPeak, float rawTemp) {
  WiFiClientSecure client;
  client.setInsecure();
  
  HTTPClient http;

  String url = "https://";
  url += FIREBASE_HOST;
  url += "/bearingpulse/readings.json?auth=";
  url += FIREBASE_API_KEY;

#if ARDUINOJSON_VERSION_MAJOR >= 7
  JsonDocument doc;
#else
  StaticJsonDocument<512> doc;
#endif

  // Normalized features (used by ML model)
  doc["rms_norm"]          = rmsNorm;
  doc["crest_factor"]      = crestFactor;
  doc["kurtosis"]          = kurt;
  doc["temperature_delta"] = tempDelta;

  // Metadata
  doc["timestamp"]  = millis();
  doc["device_id"]  = DEVICE_ID;

  // Raw values (for debugging / display)
  JsonObject raw = doc["raw"].to<JsonObject>();
  raw["rms"]       = rawRms;
  raw["peak"]      = rawPeak;
  raw["temp"]      = rawTemp;

  String payload;
  serializeJson(doc, payload);

  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    Serial.printf("📤 Firebase: %d — %s\n", httpCode, http.getString().c_str());
  } else {
    Serial.printf("❌ Firebase error: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}

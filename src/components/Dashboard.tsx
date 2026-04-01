"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import SensorCard from "@/components/SensorCard";
import HealthGauge from "@/components/HealthGauge";
import TrendChart from "@/components/TrendChart";
import HealthRadar from "@/components/RawVsNormChart";
import SystemFlow from "@/components/SystemFlow";
import type { SensorReading, PredictionResult, HistoryEntry } from "@/lib/types";

export default function Dashboard() {
  const [currentReading, setCurrentReading] = useState<SensorReading | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [countdown, setCountdown] = useState(60);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const fetchRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPrediction = useCallback(async (reading: SensorReading) => {
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reading),
      });
      const data = await res.json();
      if (data.success) {
        setPrediction(data.prediction);
      }
    } catch (err) {
      console.error("Prediction error:", err);
    }
  }, []);

  const fetchNewReading = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/readings?mode=latest");
      const data = await res.json();

      if (data.success && data.reading) {
        const reading: SensorReading = data.reading;
        setCurrentReading(reading);
        setLastUpdated(new Date().toLocaleTimeString());
        await fetchPrediction(reading);

        // Add to history
        setHistory((prev) => {
          const newHistory = [...prev, { ...reading, timestamp: Date.now() }];
          return newHistory.slice(-50); // Keep last 50
        });
      } else {
        // No reading in Firebase — clear data and show waiting state
        setCurrentReading(null);
        setPrediction(null);
      }
    } catch (err) {
      console.error("Firebase fetch error:", err);
      setCurrentReading(null);
      setPrediction(null);
    }
    setIsLoading(false);
  }, [fetchPrediction]);

  // Initial load
  useEffect(() => {
    fetchNewReading();
  }, [fetchNewReading]);

  // Auto-refresh every 60s when live, with countdown
  useEffect(() => {
    if (!isLive) {
      // Clear all timers when not live
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (fetchRef.current) clearInterval(fetchRef.current);
      countdownRef.current = null;
      fetchRef.current = null;
      setCountdown(60);
      return;
    }

    // Fetch immediately when going live
    fetchNewReading();
    setCountdown(60);

    // Countdown ticker (every 1s)
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return 60;
        return prev - 1;
      });
    }, 1000);

    // Fetch every 60s
    fetchRef.current = setInterval(() => {
      fetchNewReading();
      setCountdown(60);
    }, 60000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (fetchRef.current) clearInterval(fetchRef.current);
    };
  }, [isLive, fetchNewReading]);

  return (
    <div className="relative z-10 min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 bg-navy-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <img
              src="/logo.png"
              alt="BearingPulse Logo"
              className="w-16 h-16 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-white">
                Bearing<span className="text-cyan-400">Pulse</span>
              </h1>
              <p className="text-xs text-slate-400">Predictive Maintenance Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-xs text-slate-500 hidden sm:block">
                Last update: {lastUpdated}
              </span>
            )}

            {/* Live toggle */}
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${isLive
                ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                : "bg-white/5 text-slate-400 border border-white/10 hover:border-white/20"
                }`}
            >
              <span className={`w-2 h-2 rounded-full ${isLive ? "bg-cyan-400 animate-pulse" : "bg-slate-600"}`} />
              {isLive ? (
                <span className="flex items-center gap-1.5">
                  LIVE
                  <span className="inline-flex items-center justify-center min-w-[28px] px-1 py-0.5 rounded-md bg-cyan-400/20 text-[10px] font-mono tabular-nums">
                    {countdown}s
                  </span>
                </span>
              ) : "PAUSED"}
            </button>

            {/* Manual refresh */}
            <button
              onClick={fetchNewReading}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white/5 text-slate-400 border border-white/10 hover:border-cyan-400/30 hover:text-cyan-400 transition-all duration-300 disabled:opacity-50"
            >
              <svg className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Waiting for readings banner */}
        {!isLoading && !currentReading && (
          <div className="glass-card gradient-border p-6 flex flex-col items-center justify-center gap-3 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-cyan-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white">Waiting for Sensor Readings</h2>
            <p className="text-sm text-slate-400 text-center max-w-md">
              No data found in Firebase. Make sure your ESP32 device is powered on and transmitting sensor data.
            </p>
            <button
              onClick={fetchNewReading}
              disabled={isLoading}
              className="mt-2 px-5 py-2 rounded-xl bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 text-sm font-medium hover:bg-cyan-400/20 transition-all duration-300 disabled:opacity-50"
            >
              Retry
            </button>
          </div>
        )}
        {/* Row 1: Health Gauge + Sensor Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Health Gauge */}
          <div className="lg:col-span-4">
            <HealthGauge prediction={prediction} isLoading={isLoading} />
          </div>

          {/* Sensor Cards — Normalized, motor-agnostic features */}
          <div className="lg:col-span-8 grid grid-cols-2 gap-4">
            <SensorCard
              label="RMS Norm"
              value={currentReading?.rms_norm}
              unit="×"
              icon="vibration"
              thresholds={{ warn: 1.2, danger: 1.8 }}
              rawLabel="Sensor"
              rawValue={currentReading?.raw?.rms != null ? `${currentReading.raw.rms.toFixed(3)} m/s²` : undefined}
              baseLabel="Baseline"
              baseValue={currentReading?.raw?.rms != null && currentReading.rms_norm !== 0 ? `${(currentReading.raw.rms / currentReading.rms_norm).toFixed(3)} m/s²` : undefined}
              howItWorks="Vibration now ÷ healthy vibration. 1.0× = same as normal."
            />
            <SensorCard
              label="Crest Factor"
              value={currentReading?.crest_factor}
              unit=""
              icon="acceleration"
              thresholds={{ warn: 4.0, danger: 6.0 }}
              rawLabel="Peak"
              rawValue={currentReading?.raw?.peak != null ? `${currentReading.raw.peak.toFixed(3)} g` : undefined}
              baseLabel="RMS"
              baseValue={currentReading?.raw?.rms != null ? `${currentReading.raw.rms.toFixed(3)} m/s²` : undefined}
              howItWorks="Sharpest spike ÷ average vibration. High = impacts detected."
            />
            <SensorCard
              label="Kurtosis"
              value={currentReading?.kurtosis}
              unit=""
              icon="amplitude"
              thresholds={{ warn: 5.0, danger: 10.0 }}
              rawLabel="Meaning"
              rawValue="Signal spikiness"
              baseLabel="Normal"
              baseValue="≈ 3.0"
              howItWorks="How spiky the vibration is. ~3 = smooth, >10 = sharp impacts."
            />
            <SensorCard
              label="Temp Delta"
              value={currentReading?.temperature_delta}
              unit="°C"
              icon="temperature"
              thresholds={{ warn: 10, danger: 25 }}
              rawLabel="Now"
              rawValue={currentReading?.raw?.temp != null ? `${currentReading.raw.temp.toFixed(1)}°C` : undefined}
              baseLabel="Healthy"
              baseValue={currentReading?.raw?.temp != null ? `${(currentReading.raw.temp - (currentReading?.temperature_delta ?? 0)).toFixed(1)}°C` : undefined}
              howItWorks="Current temp minus healthy temp. Rise = more friction/wear."
            />
          </div>
        </div>

        {/* Row 2: Trend Chart + Raw vs Normalized */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendChart history={history} />
          <HealthRadar reading={currentReading} />
        </div>

        {/* Row 3: System Flow */}
        <div className="grid grid-cols-1 gap-6">
          <SystemFlow isLive={isLive} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-12 py-6">
        <p className="text-center text-xs text-slate-600">
          BearingPulse v2.0 &middot; Motor-Agnostic &middot; Weighted Ensemble: RF 50% + KNN 25% + LR 25% &middot; ESP32 + MPU6050 + DS18B20
        </p>
      </footer>
    </div>
  );
}

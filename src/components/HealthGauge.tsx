"use client";

import type { PredictionResult, HealthStatus } from "@/lib/types";

interface HealthGaugeProps {
  prediction: PredictionResult | null;
  isLoading: boolean;
}

const STATUS_CONFIG: Record<HealthStatus, { color: string; bg: string; ring: string; emoji: string; desc: string }> = {
  Healthy: {
    color: "text-emerald-400",
    bg: "bg-emerald-400",
    ring: "ring-emerald-400/30",
    emoji: "✅",
    desc: "Bearing operating within normal parameters",
  },
  Degraded: {
    color: "text-yellow-400",
    bg: "bg-yellow-400",
    ring: "ring-yellow-400/30",
    emoji: "⚠️",
    desc: "Early signs of wear detected — schedule maintenance",
  },
  Danger: {
    color: "text-red-400",
    bg: "bg-red-400",
    ring: "ring-red-400/30",
    emoji: "🚨",
    desc: "Immediate attention required — risk of failure",
  },
};

export default function HealthGauge({ prediction, isLoading }: HealthGaugeProps) {
  const hasPrediction = prediction !== null;
  const status = prediction?.status || "Healthy";
  const confidence = prediction?.confidence || 0;
  const config = STATUS_CONFIG[status];

  // SVG gauge arc
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = hasPrediction ? circumference * (1 - confidence) : circumference;

  const getStrokeColor = () => {
    if (!hasPrediction) return "rgba(255,255,255,0.1)";
    switch (status) {
      case "Healthy": return "#4ade80";
      case "Degraded": return "#fbbf24";
      case "Danger": return "#ff6b6b";
    }
  };

  return (
    <div className="glass-card gradient-border p-6 flex flex-col items-center justify-center h-full min-h-[280px]">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
        Bearing Health Status
      </h3>

      {/* Circular Gauge */}
      <div className="relative w-44 h-44 mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          {/* Background circle */}
          <circle
            cx="80" cy="80" r={radius}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress arc */}
          <circle
            cx="80" cy="80" r={radius}
            stroke={getStrokeColor()}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: hasPrediction ? `drop-shadow(0 0 6px ${getStrokeColor()})` : "none",
            }}
          />
          {/* Glow ring */}
          {hasPrediction && (
            <circle
              cx="80" cy="80" r={radius}
              stroke={getStrokeColor()}
              strokeWidth="2"
              fill="none"
              opacity="0.2"
              strokeDasharray={circumference}
              strokeDashoffset={progress}
              className="transition-all duration-1000 ease-out"
              style={{
                filter: `blur(4px)`,
              }}
            />
          )}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isLoading ? (
            <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          ) : !hasPrediction ? (
            <>
              <span className="text-2xl mb-1">📡</span>
              <span className="text-xs text-slate-500 font-medium">Awaiting Data</span>
            </>
          ) : (
            <>
              <span className="text-3xl mb-1">{config.emoji}</span>
              <span className={`text-lg font-bold ${config.color}`}>
                {(confidence * 100).toFixed(0)}%
              </span>
            </>
          )}
        </div>
      </div>

      {/* Status label */}
      {hasPrediction ? (
        <>
          <div className={`px-4 py-1.5 rounded-full ${config.bg}/10 border border-current/20 ${config.color} text-sm font-bold mb-2`}>
            {status.toUpperCase()}
          </div>
          <p className="text-xs text-slate-500 text-center leading-relaxed max-w-[200px]">
            {config.desc}
          </p>
        </>
      ) : (
        <>
          <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-500 text-sm font-bold mb-2">
            NO DATA
          </div>
          <p className="text-xs text-slate-500 text-center leading-relaxed max-w-[200px]">
            Waiting for sensor readings from Firebase
          </p>
        </>
      )}
    </div>
  );
}

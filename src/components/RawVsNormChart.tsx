"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { SensorReading } from "@/lib/types";

interface HealthRadarProps {
  reading: SensorReading | null;
}

/*
  Each metric is normalized to a 0–100 "health score" scale
  where the danger threshold = 100.
  This way all 4 axes are comparable on one radar.
*/
const METRICS = [
  { key: "rms_norm", label: "RMS", danger: 1.8, unit: "×" },
  { key: "crest_factor", label: "Crest", danger: 6.0, unit: "" },
  { key: "kurtosis", label: "Kurtosis", danger: 10.0, unit: "" },
  { key: "temperature_delta", label: "Temp Δ", danger: 25.0, unit: "°C" },
] as const;

function getHealthColor(score: number): string {
  if (score >= 80) return "#ef4444";  // red
  if (score >= 55) return "#eab308";  // yellow
  return "#22c55e";                    // green
}

export default function HealthRadar({ reading }: HealthRadarProps) {
  if (!reading) {
    return (
      <div className="glass-card p-6 h-full">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
          Health Radar
        </h3>
        <div className="flex items-center justify-center h-[280px] text-slate-600 text-sm">
          Waiting for data…
        </div>
      </div>
    );
  }

  const chartData = METRICS.map((m) => {
    const raw = Math.abs(reading[m.key] as number);
    const score = Math.min((raw / m.danger) * 100, 120); // cap at 120 for visual
    return {
      metric: m.label,
      score: Number(score.toFixed(1)),
      actual: raw,
      unit: m.unit,
      danger: m.danger,
    };
  });

  // Overall max score determines the radar fill color
  const maxScore = Math.max(...chartData.map((d) => d.score));
  const fillColor = getHealthColor(maxScore);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded-xl border border-white/10 bg-navy-900/95 backdrop-blur-xl px-4 py-3 text-xs shadow-xl min-w-[160px]">
        <p className="font-semibold text-white mb-1">{d.metric}</p>
        <p className="text-slate-300">
          Value: <span className="font-mono text-cyan-400">{d.actual.toFixed(2)}{d.unit}</span>
        </p>
        <p className="text-slate-400">
          Danger at: <span className="font-mono text-red-400">{d.danger}{d.unit}</span>
        </p>
        <p className="text-slate-500 mt-1">
          {d.score < 55 ? "✅ Normal range" : d.score < 80 ? "⚠️ Warning range" : "🔴 Danger range"}
        </p>
      </div>
    );
  };

  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Health Radar
        </h3>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-500">Normal</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-slate-500">Warning</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-slate-500">Danger</span>
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid
            stroke="rgba(255,255,255,0.08)"
            gridType="polygon"
          />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
            stroke="rgba(255,255,255,0.1)"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 120]}
            tick={{ fill: "#475569", fontSize: 9 }}
            stroke="rgba(255,255,255,0.05)"
            tickCount={4}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* Danger zone reference (100% = danger threshold) */}
          <Radar
            name="Danger Zone"
            dataKey={() => 100}
            stroke="rgba(239,68,68,0.15)"
            fill="rgba(239,68,68,0.04)"
            fillOpacity={1}
            strokeDasharray="4 4"
          />
          {/* Actual values */}
          <Radar
            name="Current"
            dataKey="score"
            stroke={fillColor}
            fill={fillColor}
            fillOpacity={0.2}
            strokeWidth={2}
            dot={{
              r: 4,
              fill: fillColor,
              stroke: "#0f1535",
              strokeWidth: 2,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

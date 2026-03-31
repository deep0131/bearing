"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { HistoryEntry } from "@/lib/types";

interface TrendChartProps {
  history: HistoryEntry[];
}

export default function TrendChart({ history }: TrendChartProps) {
  const chartData = history.map((entry, idx) => ({
    idx: idx + 1,
    time: entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : `${idx + 1}`,
    rmsNorm: Number(entry.rms_norm?.toFixed(2)),
    crest: Number(entry.crest_factor?.toFixed(2)),
    tempDelta: Number(entry.temperature_delta?.toFixed(1)),
  }));

  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Sensor Trends (Normalized)
        </h3>
        <span className="text-[10px] text-slate-600 font-mono">
          {history.length} readings
        </span>
      </div>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[240px] text-slate-600 text-sm">
          Waiting for data...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#64748b", fontSize: 10 }}
              stroke="rgba(255,255,255,0.1)"
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              stroke="rgba(255,255,255,0.1)"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 21, 53, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                color: "#e2e8f0",
                fontSize: "12px",
                backdropFilter: "blur(10px)",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
            />
            <Line
              type="monotone"
              dataKey="rmsNorm"
              stroke="#00f0ff"
              strokeWidth={2}
              dot={false}
              name="RMS Norm (×)"
              activeDot={{ r: 4, fill: "#00f0ff" }}
            />
            <Line
              type="monotone"
              dataKey="crest"
              stroke="#a78bfa"
              strokeWidth={2}
              dot={false}
              name="Crest Factor"
              activeDot={{ r: 4, fill: "#a78bfa" }}
            />
            <Line
              type="monotone"
              dataKey="tempDelta"
              stroke="#ff6b6b"
              strokeWidth={2}
              dot={false}
              name="Temp Δ (°C)"
              activeDot={{ r: 4, fill: "#ff6b6b" }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

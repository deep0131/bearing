"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { SensorReading } from "@/lib/types";

interface FFTChartProps {
  reading: SensorReading | null;
}

export default function FFTChart({ reading }: FFTChartProps) {
  // Build a deterministic spectral distribution from the real freq_ratio & spectral_energy
  const generateSpectrum = () => {
    if (!reading) return [];

    const freqRatio = reading.freq_ratio;
    const spectralEnergy = reading.spectral_energy;
    const bands: { freq: string; amplitude: number; isMain: boolean }[] = [];

    // Frequency multiples representing normalized harmonic bands
    const freqMultiples = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 8.0];

    for (const mult of freqMultiples) {
      const distance = Math.abs(mult - freqRatio) / (freqRatio || 1);
      // Gaussian-like decay from the dominant frequency — no random noise
      const amp = spectralEnergy * Math.exp(-distance * 2);
      bands.push({
        freq: `${mult}×`,
        amplitude: Number(Math.max(amp, 0.001).toFixed(4)),
        isMain: Math.abs(mult - freqRatio) < freqRatio * 0.3,
      });
    }

    return bands;
  };

  const spectrum = generateSpectrum();

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Spectral Distribution
        </h3>
        {reading && (
          <div className="flex gap-3">
            <span className="text-[10px] text-cyan-400 font-mono">
              Freq Ratio: {reading.freq_ratio?.toFixed(2) ?? '—'}×
            </span>
            <span className="text-[10px] text-purple-400 font-mono">
              Energy: {reading.spectral_energy?.toFixed(3) ?? '—'}
            </span>
          </div>
        )}
      </div>

      {spectrum.length === 0 ? (
        <div className="flex items-center justify-center h-[220px] text-slate-600 text-sm">
          No spectrum data
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={spectrum} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="freq"
              tick={{ fill: "#64748b", fontSize: 10 }}
              stroke="rgba(255,255,255,0.1)"
              label={{ value: "Freq Ratio", position: "insideBottomRight", fill: "#475569", fontSize: 10, offset: -5 }}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              stroke="rgba(255,255,255,0.1)"
              label={{ value: "Energy", angle: -90, position: "insideLeft", fill: "#475569", fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 21, 53, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                color: "#e2e8f0",
                fontSize: "12px",
              }}
              formatter={(value: number) => [value.toFixed(4), "Energy"]}
              labelFormatter={(label) => `${label} baseline`}
            />
            <Bar dataKey="amplitude" radius={[4, 4, 0, 0]}>
              {spectrum.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isMain ? "#00f0ff" : "rgba(0, 240, 255, 0.3)"}
                  stroke={entry.isMain ? "#00f0ff" : "transparent"}
                  strokeWidth={entry.isMain ? 1 : 0}
                  style={entry.isMain ? { filter: "drop-shadow(0 0 4px rgba(0, 240, 255, 0.5))" } : {}}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

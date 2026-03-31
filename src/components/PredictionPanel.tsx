"use client";

import type { PredictionResult, HealthStatus } from "@/lib/types";

interface PredictionPanelProps {
  prediction: PredictionResult | null;
}

const STATUS_COLORS: Record<HealthStatus, string> = {
  Healthy: "bg-emerald-400",
  Degraded: "bg-yellow-400",
  Danger: "bg-red-400",
};

export default function PredictionPanel({ prediction }: PredictionPanelProps) {
  return (
    <div className="glass-card p-6 h-full">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
        Ensemble Prediction Breakdown
      </h3>

      {!prediction ? (
        <div className="flex items-center justify-center h-[200px] text-slate-600 text-sm">
          Awaiting prediction...
        </div>
      ) : (
        <div className="space-y-5">
          {/* Ensemble probabilities */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Ensemble Result</span>
            {(["Healthy", "Degraded", "Danger"] as HealthStatus[]).map((status) => (
              <div key={status} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-16">{status}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${STATUS_COLORS[status]}`}
                    style={{ width: `${(prediction.probabilities[status] * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-slate-300 w-12 text-right">
                  {(prediction.probabilities[status] * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>


        </div>
      )}
    </div>
  );
}

"use client";

interface SensorCardProps {
  label: string;
  value?: number | string;
  unit: string;
  icon: string;
  thresholds?: { warn: number; danger: number };
  isText?: boolean;
  /** Human-readable description of how this value is calculated */
  howItWorks?: string;
  /** The raw sensor value used in the calculation */
  rawLabel?: string;
  rawValue?: string;
  /** The baseline / reference value used */
  baseLabel?: string;
  baseValue?: string;
}

const ICONS: Record<string, JSX.Element> = {
  vibration: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  ),
  acceleration: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  temperature: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
    </svg>
  ),
  frequency: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  amplitude: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
  device: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
    </svg>
  ),
};

function getStatusColor(value: number | undefined, thresholds?: { warn: number; danger: number }) {
  if (!thresholds || value === undefined) return "text-cyan-400";
  if (value >= thresholds.danger) return "text-red-400";
  if (value >= thresholds.warn) return "text-yellow-400";
  return "text-emerald-400";
}

function getStatusBg(value: number | undefined, thresholds?: { warn: number; danger: number }) {
  if (!thresholds || value === undefined) return "bg-cyan-400/10";
  if (value >= thresholds.danger) return "bg-red-400/10";
  if (value >= thresholds.warn) return "bg-yellow-400/10";
  return "bg-emerald-400/10";
}

export default function SensorCard({
  label, value, unit, icon, thresholds, isText,
  howItWorks, rawLabel, rawValue, baseLabel, baseValue,
}: SensorCardProps) {
  const numValue = typeof value === "number" ? value : undefined;
  const colorClass = getStatusColor(numValue, thresholds);
  const bgClass = getStatusBg(numValue, thresholds);

  return (
    <div className="glass-card p-4 animate-fade-in group">
      {/* Top row: Icon+Label (left) — Raw/Baseline values (top-right) */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${bgClass} ${colorClass} transition-all duration-300`}>
            {ICONS[icon] || ICONS.device}
          </div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
        </div>
        {(rawValue || baseValue) && (
          <div className="text-[10px] text-right space-y-0.5">
            {rawValue && (
              <div>
                <span className="text-slate-500">{rawLabel || "Raw"}: </span>
                <span className="font-mono text-purple-400">{rawValue}</span>
              </div>
            )}
            {baseValue && (
              <div>
                <span className="text-slate-500">{baseLabel || "Baseline"}: </span>
                <span className="font-mono text-cyan-400/70">{baseValue}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1">
        {isText ? (
          <span className="text-lg font-bold text-cyan-400 font-mono">{value || "—"}</span>
        ) : (
          <>
            <span className={`text-2xl font-bold font-mono ${colorClass} transition-colors duration-500`}>
              {numValue !== undefined ? numValue.toFixed(2) : "—"}
            </span>
            {unit && <span className="text-sm text-slate-500 font-medium">{unit}</span>}
          </>
        )}
      </div>

      {/* How it's calculated — right aligned, 2 lines */}
      {howItWorks && (() => {
        const dotIdx = howItWorks.indexOf(". ");
        const line1 = dotIdx !== -1 ? howItWorks.slice(0, dotIdx + 1) : howItWorks;
        const line2 = dotIdx !== -1 ? howItWorks.slice(dotIdx + 2) : "";
        return (
          <div className="mt-2 text-[10px] text-slate-500 text-right leading-relaxed">
            <p>{line1}</p>
            {line2 && <p className="text-slate-400">{line2}</p>}
          </div>
        );
      })()}

      {/* Status bar */}
      {thresholds && numValue !== undefined && (
        <div className="mt-2.5 h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${numValue >= thresholds.danger
              ? "bg-gradient-to-r from-red-500 to-red-400"
              : numValue >= thresholds.warn
                ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                : "bg-gradient-to-r from-emerald-500 to-cyan-400"
              }`}
            style={{ width: `${Math.min((numValue / (thresholds.danger * 1.5)) * 100, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

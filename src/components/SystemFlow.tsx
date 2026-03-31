"use client";

interface SystemFlowProps {
  isLive: boolean;
}

const STEPS = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546" />
      </svg>
    ),
    label: "Sensors",
    detail: "MPU6050 + DS18B20",
    color: "from-cyan-400 to-blue-500",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
      </svg>
    ),
    label: "ESP32",
    detail: "Normalize + FFT",
    color: "from-blue-400 to-indigo-500",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </svg>
    ),
    label: "Firebase",
    detail: "Cloud Database",
    color: "from-amber-400 to-orange-500",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    label: "ML Model",
    detail: "RF + KNN + LR",
    color: "from-purple-400 to-pink-500",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    label: "Dashboard",
    detail: "Real-time UI",
    color: "from-emerald-400 to-cyan-500",
  },
];

export default function SystemFlow({ isLive }: SystemFlowProps) {
  return (
    <div className="glass-card p-6 h-full">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">
        System Architecture
      </h3>

      <div className="flex items-start justify-center gap-2 sm:gap-4 overflow-x-auto pb-4 pt-2 px-2 hidden-scrollbar">
        {STEPS.map((step, idx) => (
          <div key={step.label} className="flex items-center min-w-fit">
            {/* Node */}
            <div className="flex flex-col items-center gap-2.5 group w-24 text-center">
              <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1`}>
                {step.icon}
                {isLive && idx === 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full animate-pulse border-2 border-navy-900" />
                )}
              </div>
              <div className="flex flex-col items-center justify-center min-w-0">
                <p className="text-sm font-bold text-white whitespace-nowrap">{step.label}</p>
                <p className="text-[10px] text-slate-500 whitespace-nowrap mt-0.5">{step.detail}</p>
              </div>
            </div>

            {/* Connector arrow */}
            {idx < STEPS.length - 1 && (
              <div className="flex items-center mx-1 sm:mx-2 mb-7">
                <div className={`h-[2px] w-8 sm:w-12 rounded-full ${isLive ? "bg-gradient-to-r from-cyan-400/50 to-emerald-400/50" : "bg-white/10"}`} />
                {isLive && (
                  <div className="h-[2px] w-8 sm:w-12 bg-cyan-400/30 animate-pulse -ml-8 sm:-ml-12 rounded-full blur-[1px]" />
                )}
                {/* little arrow head */}
                <div className={`w-0 h-0 border-t-[3.5px] border-t-transparent border-b-[3.5px] border-b-transparent border-l-[5.5px] ${isLive ? "border-l-emerald-400/70" : "border-l-white/10"} ml-1`} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Status indicator */}
      <div className={`mt-5 pt-4 border-t border-white/5 flex items-center gap-2 ${isLive ? "text-emerald-400" : "text-slate-600"}`}>
        <span className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-slate-700"}`} />
        <span className="text-[11px] font-medium">
          {isLive ? "Pipeline Active — Streaming" : "Pipeline Idle"}
        </span>
      </div>
    </div>
  );
}

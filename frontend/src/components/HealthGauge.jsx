import { FiShield } from "react-icons/fi";

export default function HealthGauge({ healthScore = 100, status = "HEALTHY" }) {
  const score = Math.max(0, Math.min(100, Math.round(healthScore !== undefined ? healthScore : 100)));

  /* Gauge arc calculation */
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  /* Color mapping based on Health Score */
  let gaugeColor = "#10b981"; // emerald green
  let bgTint = "bg-emerald-50 text-emerald-700 border-emerald-200";
  let statusCategory = "Optimal Health";

  if (score < 60) {
    gaugeColor = "#ef4444"; // red
    bgTint = "bg-red-50 text-red-700 border-red-200";
    statusCategory = "Degraded / Critical";
  } else if (score < 85) {
    gaugeColor = "#f59e0b"; // amber
    bgTint = "bg-amber-50 text-amber-700 border-amber-200";
    statusCategory = "Elevated Risk";
  }

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-blue-100/80 shadow-sm h-full flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-slate-800">Asset Health Index</h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Multi-factor
          </span>
        </div>
        <p className="text-xs text-slate-400">Deterministic composite score</p>
      </div>

      {/* SVG Radial Gauge */}
      <div className="flex-1 flex flex-col items-center justify-center my-3">
        <div className="relative w-36 h-36">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            {/* Background track */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="11"
            />
            {/* Progress arc */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={gaugeColor}
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-slate-800 tracking-tight">
              {score}
              <span className="text-sm font-bold text-slate-400">/100</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Score
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-1.5 mt-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${bgTint}`}
          >
            <FiShield className="text-xs" />
            <span>{statusCategory} &bull; {status}</span>
          </span>
        </div>
      </div>

      {/* Educational note footer */}
      <div className="pt-2 border-t border-slate-100 text-center">
        <span className="text-[10px] text-slate-400">
          Evaluated via thermal rise & gas thresholds
        </span>
      </div>
    </div>
  );
}

import { FiZap, FiActivity, FiClock, FiShield } from "react-icons/fi";

export default function TransformerHeroCard({
  status = "HEALTHY",
  healthScore = 100,
  scenario = "NORMAL",
  assetCode = "TR-101",
  assetName = "Main Power Transformer",
  lastUpdated = "",
}) {
  const normStatus = (status || "HEALTHY").toUpperCase();
  const isWarning = normStatus === "WARNING";
  const isCritical = normStatus === "CRITICAL";

  let bgGradient = "bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-600";
  let glowColor = "shadow-blue-500/20";
  let pulseDot = "bg-emerald-300";

  if (isWarning) {
    bgGradient = "bg-gradient-to-br from-amber-500 via-orange-600 to-yellow-600";
    glowColor = "shadow-amber-500/30";
    pulseDot = "bg-amber-300";
  } else if (isCritical) {
    bgGradient = "bg-gradient-to-br from-red-600 via-rose-600 to-red-700";
    glowColor = "shadow-red-500/30";
    pulseDot = "bg-red-200";
  }

  const scenarioLabels = {
    NORMAL: "Standard Load Cycle",
    OVERHEATING: "Thermal Runaway Stress",
    GAS_ANOMALY: "Dissolved Gas Anomaly (DGA)",
  };

  return (
    <div
      className={`relative h-full min-h-[300px] rounded-3xl overflow-hidden p-6 flex flex-col justify-between text-white transition-all duration-700 shadow-xl ${bgGradient} ${glowColor}`}
    >
      {/* Decorative background glow */}
      <div className="absolute top-4 right-6 opacity-10 pointer-events-none">
        <FiZap className="text-[140px]" />
      </div>
      <div className="absolute top-6 right-10 w-32 h-16 rounded-full blur-2xl pointer-events-none bg-white/15" />
      <div className="absolute bottom-16 right-24 w-40 h-20 rounded-full blur-3xl pointer-events-none bg-white/10" />

      {/* Landscape wave SVG at bottom */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 400 50" className="w-full h-10 opacity-15" preserveAspectRatio="none">
          <path
            d="M0,30 C80,10 160,40 240,20 C320,0 360,35 400,15 L400,50 L0,50 Z"
            fill="white"
          />
        </svg>
      </div>

      {/* Top — Badges */}
      <div className="flex items-center justify-between relative z-10 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md rounded-full px-3.5 py-1.5 text-xs font-semibold">
          <FiActivity className="text-xs" />
          <span>Transformer Twin: {assetCode}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Scenario Badge */}
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-black/25 backdrop-blur-sm border border-white/20 uppercase tracking-wider">
            {scenario}
          </span>
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/25 backdrop-blur-md">
            <span className={`w-2 h-2 rounded-full ${pulseDot} animate-pulse`} />
            <span>{normStatus}</span>
          </div>
        </div>
      </div>

      {/* Center — Status & Asset Code */}
      <div className="relative z-10 my-4">
        <p className="text-xs font-medium uppercase tracking-wider text-white/70 mb-1">
          Asset Operational State
        </p>
        <div className="flex items-baseline gap-3">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-sm">
            {normStatus}
          </h2>
          <span className="text-xl font-bold text-white/80 font-mono">
            {assetCode}
          </span>
        </div>
        <p className="text-sm text-white/85 mt-1 font-medium">
          {scenarioLabels[scenario] || "Live Asset Simulation Running"}
        </p>
      </div>

      {/* Bottom — Telemetry Stat Pills */}
      <div className="relative z-10 grid grid-cols-3 gap-2.5 pt-2">
        <div className="bg-white/15 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/10">
          <div className="flex items-center gap-1 text-[10px] text-white/70 uppercase font-semibold">
            <FiShield className="text-xs" />
            <span>Health Score</span>
          </div>
          <p className="text-lg font-black leading-tight mt-0.5">{healthScore} / 100</p>
        </div>

        <div className="bg-white/15 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/10">
          <div className="flex items-center gap-1 text-[10px] text-white/70 uppercase font-semibold">
            <FiZap className="text-xs" />
            <span>Asset Role</span>
          </div>
          <p className="text-xs font-bold leading-tight mt-1 truncate" title={assetName}>
            {assetName}
          </p>
        </div>

        <div className="bg-white/15 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/10">
          <div className="flex items-center gap-1 text-[10px] text-white/70 uppercase font-semibold">
            <FiClock className="text-xs" />
            <span>Last Telemetry</span>
          </div>
          <p className="text-xs font-mono font-bold leading-tight mt-1 truncate">
            {lastUpdated ? lastUpdated.split("T")[1]?.slice(0, 8) || lastUpdated : "Live"}
          </p>
        </div>
      </div>
    </div>
  );
}

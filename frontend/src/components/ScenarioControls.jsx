import { FiSun, FiZap, FiAlertTriangle, FiRefreshCw } from "react-icons/fi";

export default function ScenarioControls({
  activeScenario = "NORMAL",
  onScenarioChange,
  loading = false,
  compact = false,
}) {
  const current = (activeScenario || "NORMAL").toUpperCase();

  const scenarios = [
    {
      id: "NORMAL",
      label: "Normal",
      shortDesc: "Nominal load & thermal balance",
      details: "Oil: 45-70°C | Winding: 55-80°C | H₂: 10-50 ppm",
      icon: FiSun,
      activeClass: compact
        ? "bg-white/[0.15] text-emerald-300 border-emerald-400/30"
        : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 border-emerald-500",
      inactiveClass: compact
        ? "bg-white/[0.05] text-slate-400 hover:bg-white/[0.1] hover:text-emerald-300 border-white/[0.08]"
        : "bg-white/70 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border-slate-200",
    },
    {
      id: "OVERHEATING",
      label: "Overheating",
      shortDesc: "Thermal runaway & load spike",
      details: "Oil rises +1.5°C/tick to >85°C | Winding >98°C",
      icon: FiZap,
      activeClass: compact
        ? "bg-white/[0.15] text-red-300 border-red-400/30"
        : "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30 border-red-500",
      inactiveClass: compact
        ? "bg-white/[0.05] text-slate-400 hover:bg-white/[0.1] hover:text-red-300 border-white/[0.08]"
        : "bg-white/70 text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-300 border-slate-200",
    },
    {
      id: "GAS_ANOMALY",
      label: "Gas Anomaly",
      shortDesc: "Partial discharge & insulation breakdown",
      details: "Hydrogen climbs +25 ppm/tick to >200 ppm",
      icon: FiAlertTriangle,
      activeClass: compact
        ? "bg-white/[0.15] text-purple-300 border-purple-400/30"
        : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border-purple-500",
      inactiveClass: compact
        ? "bg-white/[0.05] text-slate-400 hover:bg-white/[0.1] hover:text-purple-300 border-white/[0.08]"
        : "bg-white/70 text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 border-slate-200",
    },
  ];

  /* ── Compact mode: inline pill buttons for Command Center header ── */
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 bg-white/[0.06] p-1 rounded-xl border border-white/[0.05]">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isActive = current === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => onScenarioChange(sc.id)}
              disabled={loading}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border cursor-pointer ${
                isActive ? sc.activeClass : sc.inactiveClass
              }`}
            >
              <Icon className="text-xs" />
              <span>{sc.label}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
            </button>
          );
        })}
        {loading && <FiRefreshCw className="animate-spin text-xs text-slate-400 ml-1" />}
      </div>
    );
  }

  /* ── Full mode: detailed card grid ── */
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-blue-100/80 shadow-sm h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">Fault Injection & Simulation</h3>
            {loading && <FiRefreshCw className="animate-spin text-xs text-blue-600" />}
          </div>
          <p className="text-xs text-slate-400">
            Select a physical operating scenario to observe live digital twin responses
          </p>
        </div>
        <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          Server-Side Physics
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isActive = current === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => onScenarioChange(sc.id)}
              disabled={loading}
              className={`p-4 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between min-h-[110px] cursor-pointer ${
                isActive ? sc.activeClass : sc.inactiveClass
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`text-base ${isActive ? "text-white" : ""}`} />
                  <span className="text-xs font-bold tracking-tight">{sc.label}</span>
                </div>
                {isActive && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
              </div>
              <p className={`text-[11px] font-medium leading-snug ${isActive ? "text-white/90" : "text-slate-500"}`}>
                {sc.shortDesc}
              </p>
              <div className="mt-2 pt-2 border-t border-current/15">
                <span className={`text-[9px] font-mono block truncate ${isActive ? "text-white/80" : "text-slate-400"}`}>
                  {sc.details}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
        <span>State is synchronized in real-time across all active browser sessions</span>
        <span className="font-semibold text-slate-500">Scheduler: 3s tick</span>
      </div>
    </div>
  );
}

import { FiSun, FiZap, FiAlertTriangle, FiRefreshCw } from "react-icons/fi";

export default function ScenarioControls({
  activeScenario = "NORMAL",
  onScenarioChange,
  loading = false,
}) {
  const current = (activeScenario || "NORMAL").toUpperCase();

  const scenarios = [
    {
      id: "NORMAL",
      label: "Normal Operation",
      shortDesc: "Nominal load & thermal balance",
      details: "Oil: 45-70°C | Winding: 55-80°C | H₂: 10-50 ppm",
      icon: FiSun,
      activeClass:
        "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 border-emerald-500",
      inactiveClass:
        "bg-white/70 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border-slate-200",
      accentBg: "bg-emerald-100/70 text-emerald-800",
    },
    {
      id: "OVERHEATING",
      label: "Overheating Stress",
      shortDesc: "Thermal runaway & load spike",
      details: "Oil rises +1.5°C/tick to >85°C | Winding >98°C",
      icon: FiZap,
      activeClass:
        "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30 border-red-500",
      inactiveClass:
        "bg-white/70 text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-300 border-slate-200",
      accentBg: "bg-red-100/70 text-red-800",
    },
    {
      id: "GAS_ANOMALY",
      label: "Gas Anomaly (DGA)",
      shortDesc: "Partial discharge & insulation breakdown",
      details: "Hydrogen climbs +25 ppm/tick to >200 ppm",
      icon: FiAlertTriangle,
      activeClass:
        "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border-purple-500",
      inactiveClass:
        "bg-white/70 text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 border-slate-200",
      accentBg: "bg-purple-100/70 text-purple-800",
    },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-blue-100/80 shadow-sm h-full flex flex-col justify-between">
      {/* Header */}
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

      {/* Buttons Grid */}
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
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
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

      {/* Footer info note */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
        <span>State is synchronized in real-time across all active browser sessions</span>
        <span className="font-semibold text-slate-500">Scheduler: 3s tick</span>
      </div>
    </div>
  );
}

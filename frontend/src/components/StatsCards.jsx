import { FiThermometer, FiActivity, FiCloud } from "react-icons/fi";
import { BsLightningCharge } from "react-icons/bs";

export default function StatsCards({ reading }) {
  const safeReading = reading || {
    oilTemperature: 60.0,
    windingTemperature: 72.0,
    loadPercentage: 68.0,
    hydrogenPpm: 30.0,
  };

  const getMetricStatus = (val, warnThreshold, critThreshold) => {
    if (val >= critThreshold) return { label: "CRITICAL", color: "text-red-600", dot: "bg-red-500", border: "border-red-200", bg: "bg-red-50" };
    if (val >= warnThreshold) return { label: "WARNING", color: "text-amber-600", dot: "bg-amber-500", border: "border-amber-200", bg: "bg-amber-50" };
    return { label: "NORMAL", color: "text-emerald-600", dot: "bg-emerald-500", border: "border-emerald-200", bg: "bg-emerald-50" };
  };

  const oilStatus = getMetricStatus(safeReading.oilTemperature, 75, 85);
  const windingStatus = getMetricStatus(safeReading.windingTemperature, 88, 98);
  const loadStatus = getMetricStatus(safeReading.loadPercentage, 85, 95);
  const hydrogenStatus = getMetricStatus(safeReading.hydrogenPpm, 100, 200);

  const cards = [
    {
      title: "Top Oil Temperature",
      value: safeReading.oilTemperature !== undefined ? safeReading.oilTemperature.toFixed(1) : "--",
      unit: "°C",
      baseline: "Warn: >75°C | Crit: >85°C",
      icon: FiThermometer,
      iconColor: "#ef4444",
      iconBg: "bg-red-50",
      status: oilStatus,
    },
    {
      title: "Winding Temperature",
      value: safeReading.windingTemperature !== undefined ? safeReading.windingTemperature.toFixed(1) : "--",
      unit: "°C",
      baseline: "Warn: >88°C | Crit: >98°C",
      icon: BsLightningCharge,
      iconColor: "#f97316",
      iconBg: "bg-orange-50",
      status: windingStatus,
    },
    {
      title: "Active Load Factor",
      value: safeReading.loadPercentage !== undefined ? safeReading.loadPercentage.toFixed(1) : "--",
      unit: "%",
      baseline: "Warn: >85% | Crit: >95%",
      icon: FiActivity,
      iconColor: "#2563eb",
      iconBg: "bg-blue-50",
      status: loadStatus,
    },
    {
      title: "Dissolved Hydrogen (H₂)",
      value: safeReading.hydrogenPpm !== undefined ? safeReading.hydrogenPpm.toFixed(1) : "--",
      unit: "ppm",
      baseline: "Warn: >100 | Crit: >200 ppm",
      icon: FiCloud,
      iconColor: "#8b5cf6",
      iconBg: "bg-purple-50",
      status: hydrogenStatus,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-full">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-blue-100/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            {/* Top row: Icon & Status Badge */}
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                <Icon className="text-xl" style={{ color: card.iconColor }} />
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${card.status.bg} ${card.status.color} ${card.status.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${card.status.dot}`} />
                {card.status.label}
              </span>
            </div>

            {/* Value row */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {card.title}
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black text-slate-800 tracking-tight">
                  {card.value}
                </span>
                <span className="text-xs font-bold text-slate-400">{card.unit}</span>
              </div>
            </div>

            {/* Baseline threshold footer */}
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-mono">{card.baseline}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

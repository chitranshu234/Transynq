import { FiAlertTriangle, FiAlertOctagon } from "react-icons/fi";

export default function AlertBanner({ alert }) {
  if (!alert) return null;

  const isCritical = (alert.severity || "").toUpperCase() === "CRITICAL";

  return (
    <div
      className={`rounded-2xl px-5 py-3.5 border flex items-center gap-3.5 shadow-sm transition-all duration-300 ${
        isCritical
          ? "bg-gradient-to-r from-red-50 via-rose-50 to-red-100/60 border-red-300 text-red-900 animate-pulse"
          : "bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-amber-300 text-amber-900"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
          isCritical ? "bg-red-500 text-white" : "bg-amber-500 text-white"
        }`}
      >
        {isCritical ? (
          <FiAlertOctagon className="text-xl" />
        ) : (
          <FiAlertTriangle className="text-xl" />
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
              isCritical ? "bg-red-200 text-red-900" : "bg-amber-200 text-amber-900"
            }`}
          >
            {alert.severity} ALERT
          </span>
          {alert.parameter && (
            <span className="text-xs font-bold text-slate-600">
              Parameter: {alert.parameter}
            </span>
          )}
        </div>
        <p className="text-xs font-medium mt-1 text-slate-800">
          {alert.message || "Threshold violation detected on active asset."}
        </p>
      </div>

      <div className="text-right flex-shrink-0 hidden sm:block">
        <span className="text-[10px] font-mono text-slate-500 block">
          {alert.recordedAt ? new Date(alert.recordedAt).toLocaleTimeString() : "Just now"}
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Action Required
        </span>
      </div>
    </div>
  );
}

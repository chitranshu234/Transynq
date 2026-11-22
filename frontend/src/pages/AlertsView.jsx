import { useState, useEffect } from "react";
import TopBar from "../components/TopBar";
import { fetchAlerts } from "../services/api";
import { FiAlertTriangle, FiAlertOctagon, FiCheckCircle, FiRefreshCw, FiFilter } from "react-icons/fi";

export default function AlertsView() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [error, setError] = useState(null);

  const assetId = 1;

  const loadAlertsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAlerts(assetId);
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load alerts:", err);
      setError("Unable to connect to alerts endpoint.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlertsData();
  }, []);

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter === "ALL") return true;
    return (a.severity || "").toUpperCase() === severityFilter;
  });

  const activeCount = alerts.filter((a) => !a.resolvedAt).length;
  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL" && !a.resolvedAt).length;
  const warningCount = alerts.filter((a) => a.severity === "WARNING" && !a.resolvedAt).length;

  return (
    <div className="min-h-screen">
      <TopBar connectionStatus="connected" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 pb-12">
        {/* Header & Stats summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-5 rounded-3xl border border-blue-100 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              Asset Alerts & Transition History
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic state-change alerts for thermal limits and dissolved gas buildup
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold flex items-center gap-1.5">
              <span>{activeCount} Active</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>{criticalCount} Critical</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{warningCount} Warning</span>
            </div>
            <button
              onClick={loadAlertsData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 transition-all cursor-pointer"
              title="Refresh Alerts"
            >
              <FiRefreshCw className={`text-sm ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="flex items-center justify-between gap-3 bg-white/60 backdrop-blur-sm px-5 py-3 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-2">
            <FiFilter className="text-xs text-slate-400" />
            <span className="text-xs font-bold text-slate-600">Severity Filter:</span>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              {["ALL", "CRITICAL", "WARNING"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSeverityFilter(lvl)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    severityFilter === lvl
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-blue-700"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredAlerts.length} of {alerts.length} events
          </span>
        </div>

        {/* Alerts Table */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-blue-100 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-bold">Severity</th>
                  <th className="pb-3 font-bold">Parameter</th>
                  <th className="pb-3 font-bold">Message</th>
                  <th className="pb-3 font-bold">Recorded At</th>
                  <th className="pb-3 font-bold">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 italic">
                      {loading ? "Loading alerts..." : "No alerts matching current filter."}
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((alert, idx) => {
                    const isCritical = alert.severity === "CRITICAL";
                    const isResolved = !!alert.resolvedAt;

                    return (
                      <tr key={alert.id || idx} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isCritical
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : "bg-amber-100 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {isCritical ? (
                              <FiAlertOctagon className="text-xs" />
                            ) : (
                              <FiAlertTriangle className="text-xs" />
                            )}
                            {alert.severity}
                          </span>
                        </td>
                        <td className="py-3 font-bold text-slate-700">
                          {alert.parameter}
                        </td>
                        <td className="py-3 text-slate-800 max-w-md">
                          {alert.message}
                        </td>
                        <td className="py-3 font-mono text-slate-500 whitespace-nowrap">
                          {alert.recordedAt
                            ? new Date(alert.recordedAt).toLocaleString()
                            : "--"}
                        </td>
                        <td className="py-3 whitespace-nowrap">
                          {isResolved ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                              <FiCheckCircle className="text-xs" />
                              <span>Resolved ({new Date(alert.resolvedAt).toLocaleTimeString()})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              <span>ACTIVE</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import TopBar from "../components/TopBar";
import { fetchHistory } from "../services/api";
import { useAsset } from "../context/AssetContext";
import { Line } from "react-chartjs-2";
import { FiRefreshCw } from "react-icons/fi";

export default function HistoryView() {
  const { selectedAssetId: assetId, selectedAsset } = useAsset();
  const [selectedMinutes, setSelectedMinutes] = useState(60);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHistoryData = useCallback(async (minutes) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHistory(assetId, minutes);
      setReadings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load history:", err);
      setError("Unable to connect to history endpoint. Using cached data.");
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    loadHistoryData(selectedMinutes);
  }, [selectedMinutes, loadHistoryData]);

  const ranges = [
    { label: "15 Minutes", minutes: 15 },
    { label: "1 Hour", minutes: 60 },
    { label: "24 Hours", minutes: 1440 },
  ];

  // Chart data preparation
  const labels = readings.map((r) => {
    if (!r.timestamp) return "";
    const timePart = r.timestamp.includes("T") ? r.timestamp.split("T")[1] : r.timestamp;
    return timePart.slice(0, 8);
  });

  const thermalData = {
    labels,
    datasets: [
      {
        label: "Oil Temp (°C)",
        data: readings.map((r) => r.oilTemperature),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.06)",
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: readings.length > 30 ? 0 : 2,
      },
      {
        label: "Winding Temp (°C)",
        data: readings.map((r) => r.windingTemperature),
        borderColor: "#f97316",
        backgroundColor: "rgba(249, 115, 22, 0.06)",
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: readings.length > 30 ? 0 : 2,
      },
    ],
  };

  const gasData = {
    labels,
    datasets: [
      {
        label: "Dissolved Hydrogen (ppm)",
        data: readings.map((r) => r.hydrogenPpm),
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139, 92, 246, 0.08)",
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: readings.length > 30 ? 0 : 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: { font: { size: 10, family: "Inter" }, boxWidth: 10 },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8", font: { size: 9 }, maxTicksLimit: 12 },
        border: { display: false },
      },
      y: {
        grid: { color: "#f1f5f9" },
        ticks: { color: "#94a3b8", font: { size: 9 } },
        border: { display: false },
      },
    },
  };

  return (
    <div className="min-h-screen">
      <TopBar connectionStatus="connected" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 pb-12">
        {/* Title & Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-5 rounded-3xl border border-blue-100 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              Historical Telemetry & Audit Logs
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review sensor trends, thermal excursion limits, and recorded readings
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Time range buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              {ranges.map((r) => (
                <button
                  key={r.minutes}
                  onClick={() => setSelectedMinutes(r.minutes)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedMinutes === r.minutes
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-blue-700"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Refresh button */}
            <button
              onClick={() => loadHistoryData(selectedMinutes)}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-all cursor-pointer"
              title="Refresh History"
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

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Thermal Trend */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-blue-100 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 mb-1">Thermal History</h3>
            <p className="text-xs text-slate-400 mb-3">Oil & Winding Temperatures over time</p>
            <div className="h-[220px] w-full flex-1">
              <Line data={thermalData} options={chartOptions} />
            </div>
          </div>

          {/* Dissolved Gas Trend */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-blue-100 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 mb-1">Dissolved Hydrogen (H₂) History</h3>
            <p className="text-xs text-slate-400 mb-3">Early fault indicator concentrations (ppm)</p>
            <div className="h-[220px] w-full flex-1">
              <Line data={gasData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Readings Table */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-blue-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Telemetry Data Log</h3>
              <p className="text-xs text-slate-400">
                {readings.length} total readings recorded in this window
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              {selectedAsset?.code || "TR-101"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-bold">Timestamp</th>
                  <th className="pb-3 font-bold">Oil Temp</th>
                  <th className="pb-3 font-bold">Winding Temp</th>
                  <th className="pb-3 font-bold">Load %</th>
                  <th className="pb-3 font-bold">Hydrogen</th>
                  <th className="pb-3 font-bold">Health Score</th>
                  <th className="pb-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {readings.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400 italic">
                      {loading ? "Loading historical data..." : "No readings recorded yet."}
                    </td>
                  </tr>
                ) : (
                  readings.map((r, i) => (
                    <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-2.5 font-mono text-slate-600">
                        {r.timestamp ? r.timestamp.replace("T", " ").slice(0, 19) : "--"}
                      </td>
                      <td className="py-2.5 text-slate-800 font-semibold">
                        {r.oilTemperature?.toFixed(1)} °C
                      </td>
                      <td className="py-2.5 text-slate-800 font-semibold">
                        {r.windingTemperature?.toFixed(1)} °C
                      </td>
                      <td className="py-2.5 text-slate-800 font-semibold">
                        {r.loadPercentage?.toFixed(1)} %
                      </td>
                      <td className="py-2.5 text-slate-800 font-semibold">
                        {r.hydrogenPpm?.toFixed(1)} ppm
                      </td>
                      <td className="py-2.5">
                        <span className="font-bold text-slate-700">{r.healthScore}</span>
                        <span className="text-[10px] text-slate-400">/100</span>
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            r.status === "CRITICAL"
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : r.status === "WARNING"
                              ? "bg-amber-100 text-amber-700 border border-amber-200"
                              : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

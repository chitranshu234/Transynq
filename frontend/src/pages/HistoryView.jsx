import { useState, useEffect } from "react";
import TopBar from "../components/TopBar";
import { fetchHistory } from "../services/api";
import { Line } from "react-chartjs-2";
import { FiRefreshCw } from "react-icons/fi";

export default function HistoryView() {
  const [selectedMinutes, setSelectedMinutes] = useState(60);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const assetId = 1;

  const loadHistoryData = async (minutes) => {
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
  };

  useEffect(() => {
    loadHistoryData(selectedMinutes);
  }, [selectedMinutes]);

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
        {/* Command Center Header */}
        <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl px-6 py-5 border border-white/[0.06] shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                History & Trends
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Review sensor trends, thermal excursion limits, and recorded readings.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Time range pills */}
              <div className="flex items-center gap-1 bg-white/[0.06] p-1 rounded-xl border border-white/[0.05]">
                {ranges.map((r) => (
                  <button
                    key={r.minutes}
                    onClick={() => setSelectedMinutes(r.minutes)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      selectedMinutes === r.minutes
                        ? "bg-white/[0.15] text-white border border-white/10"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.08] border border-transparent"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => loadHistoryData(selectedMinutes)}
                disabled={loading}
                className="p-2.5 rounded-lg bg-white/[0.06] border border-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.1] transition-all cursor-pointer"
                title="Refresh History"
              >
                <FiRefreshCw className={`text-sm ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
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
              TR-101
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

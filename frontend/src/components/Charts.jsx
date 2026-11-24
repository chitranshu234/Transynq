import { useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const formatLocalTime = (timestamp) => {
  if (!timestamp) return "";
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) {
      const timePart = timestamp.includes("T") ? timestamp.split("T")[1] : timestamp;
      return timePart.slice(0, 8);
    }
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  } catch {
    return timestamp;
  }
};

export function TemperatureChart({ readings = [] }) {
  const chartRef = useRef(null);
  const dataPoints = readings.slice(-20);
  const labels = dataPoints.map((r) => formatLocalTime(r.timestamp));

  const oilValues = dataPoints.map((r) => r.oilTemperature);
  const windingValues = dataPoints.map((r) => r.windingTemperature);

  const data = {
    labels,
    datasets: [
      {
        label: "Oil Temp (°C)",
        data: oilValues,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.08)",
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: "#2563eb",
      },
      {
        label: "Winding Temp (°C)",
        data: windingValues,
        borderColor: "#f97316",
        backgroundColor: "rgba(249, 115, 22, 0.08)",
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: "#f97316",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          boxWidth: 12,
          font: { size: 11, weight: "600", family: "Inter" },
          color: "#475569",
        },
      },
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#0f172a",
        bodyColor: "#334155",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)}°C`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8", font: { size: 9, family: "Inter" }, maxRotation: 0 },
        border: { display: false },
      },
      y: {
        min: 20,
        max: 120,
        grid: { color: "#f1f5f9" },
        ticks: {
          color: "#94a3b8",
          font: { size: 9, family: "Inter" },
          padding: 6,
          callback: (v) => v + "°C",
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-blue-100/80 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Thermal Dynamics</h3>
          <p className="text-xs text-slate-400">Top Oil and Winding Hotspot Profile</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          Dual Thermocouples
        </span>
      </div>
      <div className="h-[200px] w-full flex-1">
        <Line ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
}

export function LoadChart({ readings = [] }) {
  const chartRef = useRef(null);
  const dataPoints = readings.slice(-20);
  const labels = dataPoints.map((r) => formatLocalTime(r.timestamp));

  const loadValues = dataPoints.map((r) => r.loadPercentage);

  const data = {
    labels,
    datasets: [
      {
        label: "Load %",
        data: loadValues,
        borderColor: "#0284c7",
        backgroundColor: "rgba(2, 132, 199, 0.1)",
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: "#0284c7",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#0f172a",
        bodyColor: "#334155",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: (ctx) => ` Transformer Load: ${ctx.parsed.y?.toFixed(1)}%`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8", font: { size: 9, family: "Inter" }, maxRotation: 0 },
        border: { display: false },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: "#f1f5f9" },
        ticks: {
          color: "#94a3b8",
          font: { size: 9, family: "Inter" },
          padding: 6,
          callback: (v) => v + "%",
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-blue-100/80 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Operational Loading</h3>
          <p className="text-xs text-slate-400">Transformer Loading Over Time</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
          CT Secondary
        </span>
      </div>
      <div className="h-[200px] w-full flex-1">
        <Line ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
}

export default function Charts({ readings = [] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-7">
        <TemperatureChart readings={readings} />
      </div>
      <div className="lg:col-span-5">
        <LoadChart readings={readings} />
      </div>
    </div>
  );
}

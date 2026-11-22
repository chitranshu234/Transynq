import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FiWifi, FiWifiOff, FiCpu, FiChevronDown } from "react-icons/fi";
import { useAsset } from "../context/AssetContext";

export default function TopBar({ connectionStatus = "connected" }) {
  const { assets, selectedAssetId, setSelectedAssetId } = useAsset();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dayName = time.toLocaleDateString("en-US", { weekday: "short" });
  const dateStr = time.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeStr = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const isConnected = connectionStatus === "connected";
  const isReconnecting = connectionStatus === "reconnecting";

  return (
    <header className="px-6 py-3 border-b border-blue-100/60 bg-white/70 backdrop-blur-md sticky top-0 z-30 mb-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left — Official Brand Logo */}
        <div className="flex items-center gap-3">
          <NavLink to="/" className="flex items-center gap-2.5">
            <img
              src="/transynq-logo.png"
              alt="Transynq Digital Twin"
              className="h-8 md:h-8.5 w-auto object-contain"
            />
          </NavLink>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/80">
            Digital Twin
          </span>
        </div>

        {/* Center — Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 shadow-inner">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-400/30"
                  : "text-slate-600 hover:text-blue-700 hover:bg-white/80"
              }`
            }
          >
            Live Dashboard
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-400/30"
                  : "text-slate-600 hover:text-blue-700 hover:bg-white/80"
              }`
            }
          >
            History & Trends
          </NavLink>
          <NavLink
            to="/alerts"
            className={({ isActive }) =>
              `px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-400/30"
                  : "text-slate-600 hover:text-blue-700 hover:bg-white/80"
              }`
            }
          >
            Alerts Log
          </NavLink>
        </nav>

        {/* Right — System Status & Controls */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center">
          {/* Asset Selector */}
          <div className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/70 transition-colors text-slate-700 text-xs font-semibold border border-slate-200 shadow-sm">
            <FiCpu className="text-blue-600 text-xs flex-shrink-0" />
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(Number(e.target.value))}
              className="bg-transparent text-slate-800 text-xs font-bold outline-none cursor-pointer pr-3.5 appearance-none"
              title="Select Asset to Monitor"
            >
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id} className="text-slate-800 bg-white">
                  {asset.code}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute right-2 text-slate-400 text-[10px] pointer-events-none" />
          </div>

          {/* SSE Stream Status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isConnected
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : isReconnecting
                ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                : "bg-red-50 text-red-600 border-red-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? "bg-emerald-500 animate-pulse"
                  : isReconnecting
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
            />
            <span>{isConnected ? "Live SSE" : isReconnecting ? "Reconnecting" : "Offline"}</span>
          </div>

          {/* Clock */}
          <div className="text-right hidden xl:block pl-2.5 border-l border-slate-200">
            <p className="text-xs font-bold text-slate-700 font-mono leading-tight">{timeStr}</p>
            <p className="text-[10px] text-slate-400 font-medium leading-tight">
              {dayName}, {dateStr}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

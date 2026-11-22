import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FiZap, FiWifi, FiWifiOff, FiCpu, FiBell, FiSearch } from "react-icons/fi";

export default function TopBar({ connectionStatus = "connected" }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

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
    <header className="px-4 pt-4 pb-2 mb-4">
      <div className="max-w-7xl mx-auto">
        {/* ── Main Navbar Pill ── */}
        <div className="flex items-center justify-between gap-3 bg-slate-900/85 backdrop-blur-xl rounded-2xl px-5 py-3 border border-white/[0.06] shadow-2xl shadow-black/30">
          {/* Left — Brand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25 text-white">
              <FiZap className="text-xl" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-black text-white leading-tight tracking-tight">
                Transynq
              </h1>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">
                Digital Twin
              </p>
            </div>
          </div>

          {/* Center — Nav Links (styled as pill group inside the bar) */}
          <nav className="flex items-center gap-1 bg-white/[0.06] backdrop-blur-sm p-1 rounded-xl border border-white/[0.05]">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-white/[0.12] text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-white/[0.12] text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                }`
              }
            >
              History
            </NavLink>
            <NavLink
              to="/alerts"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-white/[0.12] text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                }`
              }
            >
              Alerts
            </NavLink>
          </nav>

          {/* Right — Status Indicators */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Asset Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] text-slate-300 text-[11px] font-semibold border border-white/[0.05]">
              <FiCpu className="text-cyan-400 text-xs" />
              <span>TR-101</span>
            </div>

            {/* SSE Status */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                isConnected
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : isReconnecting
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}
            >
              {isConnected ? (
                <FiWifi className="text-xs" />
              ) : (
                <FiWifiOff className="text-xs" />
              )}
              <span className="hidden sm:inline">
                {isConnected ? "Live" : isReconnecting ? "Reconnecting" : "Offline"}
              </span>
            </div>

            {/* Notification Bell */}
            <div className="relative w-9 h-9 rounded-lg bg-white/[0.06] border border-white/[0.05] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.1] transition-all cursor-pointer">
              <FiBell className="text-sm" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-900" />
            </div>

            {/* Clock */}
            <div className="hidden lg:block text-right pl-2 border-l border-white/[0.08]">
              <p className="text-[11px] font-bold text-slate-200 font-mono leading-tight">
                {timeStr}
              </p>
              <p className="text-[10px] text-slate-500 font-medium leading-tight">
                {dateStr}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

import { FiGithub, FiCheckCircle } from "react-icons/fi";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white/50 backdrop-blur-md py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        {/* Left: Brand info */}
        <div className="flex items-center gap-3">
          <img
            src="/transynq-mark.png"
            alt="Transynq"
            className="w-5 h-5 object-contain"
          />
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Transynq</span>
            <span className="text-slate-300">•</span>
            <span>Electrical Transformer Digital Twin</span>
          </div>
        </div>

        {/* Right: User Attribution requested */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200/80 shadow-sm">
            <span>Built by <strong className="text-blue-700">Chitranshu Pandey</strong></span>
          </div>
          <a
            href="https://github.com/chitranshu234/Transynq"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
            title="GitHub Repository"
          >
            <FiGithub className="text-sm" />
          </a>
        </div>
      </div>
    </footer>
  );
}

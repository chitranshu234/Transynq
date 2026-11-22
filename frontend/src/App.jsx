import { Routes, Route } from "react-router-dom";
import { AssetProvider } from "./context/AssetContext";
import Dashboard from "./pages/Dashboard";
import HistoryView from "./pages/HistoryView";
import AlertsView from "./pages/AlertsView";
import Footer from "./components/Footer";

function App() {
  return (
    <AssetProvider>
      <div className="min-h-screen flex flex-col justify-between">
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/history" element={<HistoryView />} />
            <Route path="/alerts" element={<AlertsView />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </AssetProvider>
  );
}

export default App;

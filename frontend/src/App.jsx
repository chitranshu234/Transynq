import { Routes, Route } from "react-router-dom";
import { AssetProvider } from "./context/AssetContext";
import Dashboard from "./pages/Dashboard";
import HistoryView from "./pages/HistoryView";
import AlertsView from "./pages/AlertsView";

function App() {
  return (
    <AssetProvider>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/history" element={<HistoryView />} />
        <Route path="/alerts" element={<AlertsView />} />
      </Routes>
    </AssetProvider>
  );
}

export default App;

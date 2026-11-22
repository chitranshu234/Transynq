import { useState, useEffect, useCallback } from "react";
import TopBar from "../components/TopBar";
import TransformerHeroCard from "../components/TransformerHeroCard";
import StatsCards from "../components/StatsCards";
import Charts from "../components/Charts";
import AlertBanner from "../components/AlertBanner";
import HealthGauge from "../components/HealthGauge";
import ScenarioControls from "../components/ScenarioControls";
import {
  fetchLatestReading,
  fetchAlerts,
  setScenario as apiSetScenario,
  subscribeToStream,
} from "../services/api";

const INITIAL_READING = {
  assetId: 1,
  assetCode: "TR-101",
  assetName: "Main Power Transformer",
  timestamp: new Date().toISOString(),
  oilTemperature: 60.5,
  windingTemperature: 72.8,
  loadPercentage: 68.2,
  hydrogenPpm: 32.0,
  healthScore: 100,
  status: "HEALTHY",
  scenario: "NORMAL",
};

export default function Dashboard() {
  const [currentReading, setCurrentReading] = useState(INITIAL_READING);
  const [activeAlert, setActiveAlert] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("reconnecting");
  const [readingsBuffer, setReadingsBuffer] = useState([INITIAL_READING]);
  const [scenario, setScenario] = useState("NORMAL");
  const [loadingScenario, setLoadingScenario] = useState(false);

  const assetId = 1;

  // Fetch unresolved alerts
  const refreshAlerts = useCallback(async () => {
    try {
      const alerts = await fetchAlerts(assetId);
      if (Array.isArray(alerts)) {
        const unresolved = alerts.find((a) => !a.resolvedAt);
        setActiveAlert(unresolved || null);
      }
    } catch (err) {
      console.warn("Failed to refresh alerts:", err);
    }
  }, [assetId]);

  // Initial data bootstrap & SSE subscription
  useEffect(() => {
    let isMounted = true;

    // 1. Fetch latest reading
    fetchLatestReading(assetId)
      .then((data) => {
        if (isMounted && data) {
          setCurrentReading(data);
          setScenario(data.scenario || "NORMAL");
          setReadingsBuffer([data]);
        }
      })
      .catch((err) => console.warn("Failed to fetch initial latest reading:", err));

    // 2. Fetch initial alerts
    refreshAlerts();

    // 3. Connect to live SSE stream
    const unsubscribe = subscribeToStream(
      assetId,
      (reading) => {
        if (!isMounted) return;
        setConnectionStatus("connected");
        setCurrentReading(reading);
        if (reading.scenario) {
          setScenario(reading.scenario);
        }

        // Keep last 40 readings for responsive charting
        setReadingsBuffer((prev) => {
          const updated = [...prev, reading];
          return updated.slice(-40);
        });

        // If status changed or not healthy, check alerts
        if (reading.status !== "HEALTHY") {
          refreshAlerts();
        } else {
          // If recovered to healthy, check if alert was resolved
          refreshAlerts();
        }
      },
      () => {
        if (isMounted) setConnectionStatus("reconnecting");
      },
      () => {
        if (isMounted) setConnectionStatus("connected");
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [assetId, refreshAlerts]);

  // Handle switching scenario
  const handleScenarioChange = async (newScenario) => {
    if (newScenario === scenario) return;
    setLoadingScenario(true);
    try {
      setScenario(newScenario);
      await apiSetScenario(assetId, newScenario);
      await refreshAlerts();
    } catch (err) {
      console.error("Failed to switch scenario:", err);
    } finally {
      setLoadingScenario(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopBar connectionStatus={connectionStatus} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5 pb-12">
        {/* Dynamic Anomaly Alert Banner */}
        {activeAlert && <AlertBanner alert={activeAlert} />}

        {/* Row 1: Hero Asset Card + Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5">
            <TransformerHeroCard
              status={currentReading.status}
              healthScore={currentReading.healthScore}
              scenario={scenario}
              assetCode={currentReading.assetCode || "TR-101"}
              assetName={currentReading.assetName || "Main Power Transformer"}
              lastUpdated={currentReading.timestamp}
            />
          </div>
          <div className="lg:col-span-7">
            <StatsCards reading={currentReading} />
          </div>
        </div>

        {/* Row 2: Live Charts (Thermal & Load) */}
        <Charts readings={readingsBuffer} />

        {/* Row 3: Health Gauge + Scenario Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4">
            <HealthGauge
              healthScore={currentReading.healthScore}
              status={currentReading.status}
            />
          </div>
          <div className="lg:col-span-8">
            <ScenarioControls
              activeScenario={scenario}
              onScenarioChange={handleScenarioChange}
              loading={loadingScenario}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

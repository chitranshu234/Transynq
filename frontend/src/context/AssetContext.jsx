import { createContext, useContext, useState, useEffect } from "react";
import { fetchAssets } from "../services/api";

const AssetContext = createContext();

export function AssetProvider({ children }) {
  const [assets, setAssets] = useState([
    { id: 1, code: "TR-101", name: "Main Power Transformer", location: "Substation A, Bay 3", status: "HEALTHY" },
    { id: 2, code: "TR-202", name: "Distribution Transformer (25 MVA)", location: "Substation B, Bay 1", status: "HEALTHY" },
    { id: 3, code: "SG-301", name: "11 kV Switchgear Panel", location: "Substation A, Bay 7", status: "HEALTHY" },
  ]);
  const [selectedAssetId, setSelectedAssetId] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchAssets()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setAssets(data);
        }
      })
      .catch((err) => console.warn("Failed to fetch asset list, using defaults:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedAsset = assets.find((a) => a.id === Number(selectedAssetId)) || assets[0];

  return (
    <AssetContext.Provider
      value={{
        assets,
        selectedAssetId: Number(selectedAssetId),
        setSelectedAssetId,
        selectedAsset,
        loading,
      }}
    >
      {children}
    </AssetContext.Provider>
  );
}

export function useAsset() {
  const ctx = useContext(AssetContext);
  if (!ctx) {
    throw new Error("useAsset must be used within an AssetProvider");
  }
  return ctx;
}

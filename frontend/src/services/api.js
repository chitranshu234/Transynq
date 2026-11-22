const API_BASE = '';

export async function fetchAssets() {
  const res = await fetch(`${API_BASE}/api/assets`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function fetchLatestReading(assetId = 1) {
  const res = await fetch(`${API_BASE}/api/assets/${assetId}/latest`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
}

export async function fetchHistory(assetId = 1, minutes = 60) {
  const res = await fetch(`${API_BASE}/api/assets/${assetId}/history?minutes=${minutes}`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function fetchAlerts(assetId = 1) {
  const res = await fetch(`${API_BASE}/api/assets/${assetId}/alerts`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function setScenario(assetId = 1, scenario) {
  const res = await fetch(`${API_BASE}/api/assets/${assetId}/scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario }),
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export function subscribeToStream(assetId = 1, onMessage, onError, onOpen) {
  let es = null;
  let reconnectTimeout = null;
  let isClosed = false;

  function connect() {
    if (isClosed) return;
    try {
      es = new EventSource(`${API_BASE}/api/assets/${assetId}/stream`);

      es.onopen = () => {
        onOpen?.();
      };

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          onMessage(data);
        } catch (err) {
          console.error('SSE parse error:', err, e.data);
        }
      };

      es.onerror = (err) => {
        console.warn('SSE connection error, will reconnect...', err);
        onError?.(err);
        if (es) {
          es.close();
          es = null;
        }
        if (!isClosed) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };
    } catch (err) {
      console.error('Failed to initialize EventSource:', err);
      onError?.(err);
      if (!isClosed) {
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }
  }

  connect();

  return () => {
    isClosed = true;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (es) {
      es.close();
      es = null;
    }
  };
}

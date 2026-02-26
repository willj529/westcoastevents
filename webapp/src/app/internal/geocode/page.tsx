"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

interface GeoStatus {
  total: number;
  geocoded: number;
  noAddress: number;
  remaining: number;
  next: { id: number; name: string; address: string } | null;
}

interface LogEntry {
  name: string;
  result: string;
  success: boolean;
}

export default function GeocodePage() {
  const [status, setStatus] = useState<GeoStatus | null>(null);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);

  const fetchStatus = useCallback(async () => {
    const res = await fetch("/api/geocode");
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to fetch status");
      return null;
    }
    const data = await res.json();
    setStatus(data);
    setError(null);
    return data as GeoStatus;
  }, []);

  const geocodeNext = useCallback(async (): Promise<boolean> => {
    const stat = await fetchStatus();
    if (!stat || !stat.next) return false;

    const { id, name, address } = stat.next;

    const res = await fetch("/api/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, address }),
    });

    const data = await res.json();

    if (data.success) {
      setLog((prev) => [
        { name, result: `${data.lat.toFixed(5)}, ${data.lon.toFixed(5)}`, success: true },
        ...prev,
      ]);
    } else {
      setLog((prev) => [
        { name, result: data.reason || data.error || "Failed", success: false },
        ...prev,
      ]);
    }

    return true;
  }, [fetchStatus]);

  const startGeocoding = useCallback(async () => {
    setRunning(true);
    setPaused(false);

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Check pause flag via a ref-like trick: read from DOM
      const pauseBtn = document.getElementById("pause-state");
      if (pauseBtn?.dataset.paused === "true") break;

      const hasMore = await geocodeNext();
      if (!hasMore) break;

      // Wait 1.2s between requests (Nominatim rate limit)
      await new Promise((r) => setTimeout(r, 1200));
    }

    setRunning(false);
    await fetchStatus();
  }, [geocodeNext, fetchStatus]);

  const handlePause = () => {
    setPaused(true);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/internal"
        className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-700"
      >
        &larr; Internal Dashboard
      </Link>

      <h1 className="mb-2 text-3xl font-bold tracking-tight">
        Geocode Restaurants
      </h1>
      <p className="mb-6 text-zinc-600">
        Add map coordinates to restaurants using their addresses. Uses the free
        OpenStreetMap geocoder (~1 restaurant per second).
      </p>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Status card */}
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6">
        {status ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <div className="text-2xl font-bold">{status.total}</div>
              <div className="text-sm text-zinc-500">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">
                {status.geocoded}
              </div>
              <div className="text-sm text-zinc-500">Geocoded</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">
                {status.remaining}
              </div>
              <div className="text-sm text-zinc-500">Remaining</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-zinc-400">
                {status.noAddress}
              </div>
              <div className="text-sm text-zinc-500">No Address</div>
            </div>
          </div>
        ) : (
          <p className="text-zinc-500">Click &quot;Check Status&quot; to load progress.</p>
        )}

        {/* Progress bar */}
        {status && status.total > 0 && (
          <div className="mt-4">
            <div className="h-3 w-full rounded-full bg-zinc-200">
              <div
                className="h-3 rounded-full bg-emerald-500 transition-all duration-300"
                style={{
                  width: `${(status.geocoded / status.total) * 100}%`,
                }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-zinc-500">
              {Math.round((status.geocoded / status.total) * 100)}% complete
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={fetchStatus}
          disabled={running}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50"
        >
          Check Status
        </button>
        {!running ? (
          <button
            onClick={startGeocoding}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            {status && status.geocoded > 0
              ? "Resume Geocoding"
              : "Start Geocoding"}
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
          >
            {paused ? "Stopping..." : "Pause"}
          </button>
        )}
      </div>

      {/* Hidden element to communicate pause state to the loop */}
      <div id="pause-state" data-paused={paused ? "true" : "false"} className="hidden" />

      {running && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Geocoding in progress... you can leave this tab open and it will keep
          running. The map will show pins as restaurants are geocoded.
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-4 py-3 text-sm font-medium text-zinc-600">
            Recent Activity ({log.length} processed)
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-zinc-50">
            {log.map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-2 text-sm"
              >
                <span className="truncate">{entry.name}</span>
                <span
                  className={`ml-3 shrink-0 text-xs ${
                    entry.success ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {entry.result}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

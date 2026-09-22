// app/forecast/page.tsx
"use client";
import { useState, useEffect } from "react";
import { getDefaultWindow, runForecast, DefaultWindowResult } from "@/lib/api";
import { useStore } from "@/lib/store";
import RunButton from "@/components/RunButton";
import Alert from "@/components/Alert";

export default function ForecastPage() {
  const store = useStore();
  const [loadingWindow, setLoadingWindow] = useState(false);
  const [forecasting, setForecasting] = useState(false);
  const [windowData, setWindowData] = useState<DefaultWindowResult | null>(store.current.forecastWindow);
  const [rows, setRows] = useState<Record<string, number>[]>(store.current.forecastRows);
  const [prediction, setPrediction] = useState<number | null>(store.current.forecastPrediction);
  const [error, setError] = useState<string | null>(null);

  // Sync state → store on every change
  useEffect(() => { store.current.forecastWindow = windowData; }, [windowData, store]);
  useEffect(() => { store.current.forecastRows = rows; }, [rows, store]);
  useEffect(() => { store.current.forecastPrediction = prediction; }, [prediction, store]);

  async function loadWindow() {
    setLoadingWindow(true);
    setError(null);
    try {
      const data = await getDefaultWindow();
      setWindowData(data);
      setRows(data.window.map((r) => ({ ...r })));
      setPrediction(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingWindow(false);
    }
  }

  // Auto-load on first visit only (when no cached window exists)
  useEffect(() => {
    if (!store.current.forecastWindow) {
      loadWindow();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCell(rowIdx: number, col: string, val: string) {
    setRows((prev) =>
      prev.map((r, i) => (i === rowIdx ? { ...r, [col]: parseFloat(val) || 0 } : r))
    );
  }

  async function handleForecast() {
    setForecasting(true);
    setError(null);
    try {
      const res = await runForecast(rows);
      setPrediction(res.predicted_arrivals);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setForecasting(false);
    }
  }

  const features = windowData?.features ?? [];

  return (
    <div className="max-w-5xl flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="page-heading">Forecast</h1>
        <p className="text-sm text-slate-500 pl-3">
          Edit the last 12 months of feature readings below, then forecast next month.
        </p>
      </div>

      {error && <Alert type="error" message={error} />}

      {!windowData && !error && (
        <Alert type="info" message="Loading default window… Run steps 1–4 first if this fails." />
      )}

      {windowData && (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  {features.map((f) => (
                    <th key={f}>{f}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 text-slate-500 font-mono text-xs font-medium">
                      t-{rows.length - i}
                    </td>
                    {features.map((f) => (
                      <td key={f} className="px-1 py-1">
                        <input
                          type="number"
                          step="any"
                          value={row[f]}
                          onChange={(e) => handleCell(i, f, e.target.value)}
                          className="w-24 rounded border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-4">
            <RunButton onClick={handleForecast} loading={forecasting} label="Forecast next month" />
            <button
              onClick={loadWindow}
              disabled={loadingWindow}
              className="text-sm text-blue-600 hover:underline disabled:opacity-50 transition-opacity"
            >
              Reset to defaults
            </button>
          </div>

          {prediction !== null && (
            <div className="rounded-lg border border-green-300 bg-green-50 px-6 py-5 flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                Predicted arrivals — next month
              </p>
              <p className="text-4xl font-bold text-green-900 tabular-nums">
                {prediction.toLocaleString()}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}



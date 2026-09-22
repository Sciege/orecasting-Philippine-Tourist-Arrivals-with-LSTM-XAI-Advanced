// app/dataset/page.tsx
"use client";
import { useState, useEffect } from "react";
import { loadDataset, DatasetResult } from "@/lib/api";
import { useStore } from "@/lib/store";
import RunButton from "@/components/RunButton";
import Alert from "@/components/Alert";

export default function DatasetPage() {
  const store = useStore();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DatasetResult | null>(store.current.dataset);
  const [error, setError] = useState<string | null>(null);

  // Persist result into the store whenever it changes
  useEffect(() => { store.current.dataset = result; }, [result, store]);

  async function handle() {
    setLoading(true);
    setError(null);
    try {
      setResult(await loadDataset());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="page-heading">Dataset</h1>
        <p className="text-sm text-slate-500 pl-3">
          Load <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">tourist_arrivals.csv</code> and inspect the monthly time series.
        </p>
      </div>

      <RunButton onClick={handle} loading={loading} label="Load dataset" />

      {error && <Alert type="error" message={error} />}

      {result && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Rows", value: result.rows },
              { label: "Columns", value: result.columns },
              { label: "Start", value: result.date_min },
              { label: "End", value: result.date_max },
            ].map(({ label, value }) => (
              <div key={label} className="stat-card">
                <p className="stat-label">{label}</p>
                <p className="stat-value">{value}</p>
              </div>
            ))}
          </div>

          {result.missing_months.length === 0 ? (
            <Alert type="success" message="No gaps in the monthly sequence." />
          ) : (
            <Alert
              type="warning"
              message={`Missing months: ${result.missing_months.join(", ")}`}
            />
          )}

          <div>
            <h2 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide pl-1">
              Preview — first 10 rows
            </h2>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="data-table">
                <thead>
                  <tr>
                    {result.column_names.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.preview.map((row, i) => (
                    <tr key={i}>
                      {result.column_names.map((col) => (
                        <td key={col}>{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!result && !error && (
        <Alert type="info" message='Click "Load dataset" to read tourist_arrivals.csv.' />
      )}
    </div>
  );
}



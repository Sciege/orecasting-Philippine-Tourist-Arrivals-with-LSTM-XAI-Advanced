// app/clean/page.tsx
"use client";
import { useState, useEffect } from "react";
import { runClean, CleanResult } from "@/lib/api";
import { useStore } from "@/lib/store";
import RunButton from "@/components/RunButton";
import Alert from "@/components/Alert";

export default function CleanPage() {
  const store = useStore();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CleanResult | null>(store.current.clean);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { store.current.clean = result; }, [result, store]);

  async function handle() {
    setLoading(true);
    setError(null);
    try {
      setResult(await runClean());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="page-heading">Clean</h1>
        <p className="text-sm text-slate-500 pl-3">
          Remove duplicates, one-hot encode categories, impute gaps, and flag IQR outliers.
        </p>
      </div>

      <RunButton onClick={handle} loading={loading} label="Run cleaning" />

      {error && <Alert type="error" message={error} />}

      {result && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Stat label="Duplicates removed" value={result.duplicates_removed} />
            <Stat label="Rows after clean" value={result.rows} />
            <Stat label="Columns after encode" value={result.columns} />
          </div>

          <div className="section-card flex flex-col gap-2">
            <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              IQR bounds on arrivals
            </h2>
            <p className="text-sm text-slate-600">
              Lower: <strong className="text-slate-900">{result.iqr_lower.toLocaleString()}</strong>
              <span className="mx-2 text-slate-300">|</span>
              Upper: <strong className="text-slate-900">{result.iqr_upper.toLocaleString()}</strong>
            </p>
          </div>

          {Object.keys(result.missing_before_impute).length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
              <h2 className="text-xs font-semibold text-amber-800 mb-2 uppercase tracking-wide">
                Missing values — imputed with ffill / bfill
              </h2>
              <ul className="text-sm text-amber-700 list-disc pl-4 space-y-0.5">
                {Object.entries(result.missing_before_impute).map(([col, count]) => (
                  <li key={col}>{col}: {count}</li>
                ))}
              </ul>
            </div>
          ) : (
            <Alert type="success" message="No missing values detected before imputation." />
          )}

          {result.flagged_outliers.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide pl-1">
                Flagged outliers ({result.flagged_outliers.length})
              </h2>
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Arrivals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.flagged_outliers.map((row, i) => (
                      <tr key={i}>
                        <td>{row.date}</td>
                        <td>{row.arrivals}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!result && !error && (
        <Alert type="info" message='Click "Run cleaning" to process the loaded dataset.' />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}



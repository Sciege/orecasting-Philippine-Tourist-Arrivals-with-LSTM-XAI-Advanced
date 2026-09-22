// app/features/page.tsx
"use client";
import { useState, useEffect } from "react";
import { runFeatures, FeaturesResult } from "@/lib/api";
import { useStore } from "@/lib/store";
import RunButton from "@/components/RunButton";
import Alert from "@/components/Alert";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

export default function FeaturesPage() {
  const store = useStore();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FeaturesResult | null>(store.current.features);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { store.current.features = result; }, [result, store]);

  async function handle() {
    setLoading(true);
    setError(null);
    try {
      setResult(await runFeatures());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const chartData = result
    ? result.spearman_results
        .map((r) => ({ name: r.feature, rho: parseFloat(Math.abs(r.rho).toFixed(3)), p: r.p_value }))
        .sort((a, b) => b.rho - a.rho)
    : [];

  return (
    <div className="max-w-4xl flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="page-heading">Feature Selection</h1>
        <p className="text-sm text-slate-500 pl-3">
          Spearman correlation filter followed by iterative VIF pruning.
        </p>
      </div>

      <RunButton onClick={handle} loading={loading} label="Run Spearman + VIF" />

      {error && <Alert type="error" message={error} />}

      {result && (
        <>
          <Alert
            type="success"
            message={`Selected features (${result.selected_features.length}): ${result.selected_features.join(", ")}`}
          />

          <div className="section-card">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Spearman |ρ| — all candidates
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 120, right: 20 }}>
                <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip formatter={(v: number) => v.toFixed(3)} />
                <Bar dataKey="rho" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={
                        result.selected_features.includes(entry.name)
                          ? "#2563eb"
                          : "#cbd5e1"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-400 mt-2">
              Blue = passed filter (|ρ| &gt; 0.10, p &lt; 0.05)
            </p>
          </div>

          {result.vif_removals.length > 0 && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-5">
              <h2 className="text-xs font-semibold text-orange-800 mb-2 uppercase tracking-wide">
                VIF removals — threshold 5
              </h2>
              <ul className="text-sm text-orange-700 list-disc pl-4 space-y-0.5">
                {result.vif_removals.map((v, i) => (
                  <li key={i}>
                    Dropped <strong>{v.dropped}</strong> (VIF = {v.vif.toFixed(1)})
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>ρ</th>
                  <th>p-value</th>
                  <th>Pass?</th>
                </tr>
              </thead>
              <tbody>
                {result.spearman_results.map((r) => {
                  const pass = Math.abs(r.rho) > 0.10 && r.p_value < 0.05;
                  return (
                    <tr key={r.feature}>
                      <td className="font-medium">{r.feature}</td>
                      <td>{r.rho.toFixed(4)}</td>
                      <td>{r.p_value.toExponential(2)}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${pass ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                          {pass ? "Yes" : "No"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!result && !error && (
        <Alert type="info" message='Click "Run Spearman + VIF" to select features from the cleaned dataset.' />
      )}
    </div>
  );
}



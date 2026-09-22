// app/explain/page.tsx
"use client";
import { useState, useEffect } from "react";
import { runExplain, ExplainResult } from "@/lib/api";
import { useStore } from "@/lib/store";
import RunButton from "@/components/RunButton";
import Alert from "@/components/Alert";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, CartesianGrid,
} from "recharts";

export default function ExplainPage() {
  const store = useStore();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExplainResult | null>(store.current.explain);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { store.current.explain = result; }, [result, store]);

  async function handle() {
    setLoading(true);
    setError(null);
    try {
      setResult(await runExplain());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const globalData = result
    ? Object.entries(result.global_importance)
        .map(([f, v]) => ({ name: f, value: parseFloat(v.toFixed(4)) }))
        .sort((a, b) => b.value - a.value)
    : [];

  const forecastData = result
    ? Object.entries(result.one_forecast)
        .map(([f, v]) => ({ name: f, value: parseFloat(v.toFixed(4)) }))
        .sort((a, b) => b.value - a.value)
    : [];

  const dependenceData = result
    ? result.dependence.value.map((v, i) => ({
        x: parseFloat(v.toFixed(4)),
        y: parseFloat(result.dependence.shap[i].toFixed(4)),
      }))
    : [];

  return (
    <div className="max-w-4xl flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="page-heading">Explain with SHAP</h1>
        <p className="text-sm text-slate-500 pl-3">
          KernelExplainer — 50-sample background, k-means summary. Takes a minute.
        </p>
      </div>

      <RunButton onClick={handle} loading={loading} label="Compute SHAP values" />

      {error && <Alert type="error" message={error} />}

      {result && (
        <>
          <div className="section-card">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Global feature importance — mean |SHAP|
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={globalData} layout="vertical" margin={{ left: 130, right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                <Tooltip formatter={(v: number) => v.toFixed(4)} />
                <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="section-card">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
              One forecast — per-feature SHAP contributions
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={forecastData} layout="vertical" margin={{ left: 130, right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                <Tooltip formatter={(v: number) => v.toFixed(4)} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="section-card">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Dependence plot — {result.top_feature}
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="x" name={result.top_feature} tick={{ fontSize: 11 }} label={{ value: result.top_feature, position: "insideBottom", offset: -10, fontSize: 11 }} />
                <YAxis dataKey="y" name="SHAP" tick={{ fontSize: 11 }} label={{ value: "SHAP value", angle: -90, position: "insideLeft", fontSize: 11 }} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={dependenceData} fill="#2563eb" opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {!result && !error && (
        <Alert type="info" message='Click "Compute SHAP values" to explain the model.' />
      )}
    </div>
  );
}



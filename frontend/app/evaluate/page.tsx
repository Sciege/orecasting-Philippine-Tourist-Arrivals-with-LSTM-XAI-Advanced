// app/evaluate/page.tsx
"use client";
import { useState, useEffect } from "react";
import { runEvaluate, EvaluateResult, Scores } from "@/lib/api";
import { useStore } from "@/lib/store";
import RunButton from "@/components/RunButton";
import Alert from "@/components/Alert";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const MODELS = ["LSTM", "Naive", "Seasonal naive"] as const;
const METRICS = ["MAE", "RMSE", "MAPE", "R2"] as const;

export default function EvaluatePage() {
  const store = useStore();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluateResult | null>(store.current.evaluate);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { store.current.evaluate = result; }, [result, store]);

  async function handle() {
    setLoading(true);
    setError(null);
    try {
      setResult(await runEvaluate());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const chartData = result
    ? result.chart.actual.map((v, i) => ({
        t: i + 1,
        Actual: v,
        Predicted: result.chart.predicted[i],
      }))
    : [];

  return (
    <div className="max-w-4xl flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="page-heading">Evaluate</h1>
        <p className="text-sm text-slate-500 pl-3">
          MAE / RMSE / MAPE / R² benchmarked against naive and seasonal-naive baselines.
        </p>
      </div>

      <RunButton onClick={handle} loading={loading} label="Score on test set" />

      {error && <Alert type="error" message={error} />}

      {result && (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  {MODELS.map((m) => (
                    <th key={m}>{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((metric) => (
                  <tr key={metric}>
                    <td className="font-semibold text-slate-700">{metric}</td>
                    {MODELS.map((m) => {
                      const val = (result.scores[m] as Scores)[metric];
                      const best =
                        metric === "R2"
                          ? MODELS.every((other) => val >= (result.scores[other] as Scores)[metric])
                          : MODELS.every((other) => val <= (result.scores[other] as Scores)[metric]);
                      return (
                        <td
                          key={m}
                          className={best ? "text-blue-600 font-bold" : "text-slate-700"}
                        >
                          {metric === "R2"
                            ? val.toFixed(4)
                            : val.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="section-card">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Actual vs Predicted — test set
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v / 1000).toFixed(0) + "k"} />
                <Tooltip formatter={(v: number) => v.toLocaleString()} />
                <Legend />
                <Line type="monotone" dataKey="Actual" stroke="#64748b" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="Predicted" stroke="#2563eb" dot={false} strokeWidth={2} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {!result && !error && (
        <Alert type="info" message='Click "Score on test set" to evaluate the trained model.' />
      )}
    </div>
  );
}



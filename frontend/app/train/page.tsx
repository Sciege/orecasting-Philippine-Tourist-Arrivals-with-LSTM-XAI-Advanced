// app/train/page.tsx
"use client";
import { useState, useEffect } from "react";
import { runTrain, TrainResult } from "@/lib/api";
import { useStore } from "@/lib/store";
import RunButton from "@/components/RunButton";
import Alert from "@/components/Alert";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export default function TrainPage() {
  const store = useStore();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrainResult | null>(store.current.train);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { store.current.train = result; }, [result, store]);

  async function handle() {
    setLoading(true);
    setError(null);
    try {
      setResult(await runTrain());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const chartData = result
    ? result.loss_history.map((loss, i) => ({
        epoch: i + 1,
        loss: parseFloat(loss.toFixed(6)),
        val_loss: parseFloat((result.val_loss_history[i] ?? 0).toFixed(6)),
      }))
    : [];

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="page-heading">Train LSTM</h1>
        <p className="text-sm text-slate-500 pl-3">
          Grid-searches 8 combinations (units × dropout × batch size) with early stopping. Takes a few minutes.
        </p>
      </div>

      <RunButton onClick={handle} loading={loading} label="Train & tune" />

      {error && <Alert type="error" message={error} />}

      {result && (
        <>
          <Alert
            type="success"
            message={`Best: units=${result.best_params.units}, dropout=${result.best_params.dropout}, batch=${result.best_params.batch_size} — val_loss = ${result.val_loss.toFixed(4)}`}
          />

          <div className="grid grid-cols-3 gap-3">
            <div className="stat-card">
              <p className="stat-label">Units</p>
              <p className="stat-value">{result.best_params.units}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Dropout</p>
              <p className="stat-value">{result.best_params.dropout}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Batch</p>
              <p className="stat-value">{result.best_params.batch_size}</p>
            </div>
          </div>

          <div className="section-card">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Training curve — best model
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <XAxis dataKey="epoch" tick={{ fontSize: 11 }} label={{ value: "Epoch", position: "insideBottom", offset: -2, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="loss" stroke="#2563eb" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="val_loss" stroke="#f59e0b" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {!result && !error && (
        <Alert type="info" message='Click "Train & tune" to fit the LSTM on the prepared sequences.' />
      )}
    </div>
  );
}



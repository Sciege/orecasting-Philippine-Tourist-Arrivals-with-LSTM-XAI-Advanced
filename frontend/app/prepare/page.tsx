// app/prepare/page.tsx
"use client";
import { useState, useEffect } from "react";
import { runPrepare, PrepareResult } from "@/lib/api";
import { useStore } from "@/lib/store";
import RunButton from "@/components/RunButton";
import Alert from "@/components/Alert";

export default function PreparePage() {
  const store = useStore();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PrepareResult | null>(store.current.prepare);
  const [trainRatio, setTrainRatio] = useState(store.current.trainRatio);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { store.current.prepare = result; }, [result, store]);
  useEffect(() => { store.current.trainRatio = trainRatio; }, [trainRatio, store]);

  async function handle() {
    setLoading(true);
    setError(null);
    try {
      setResult(await runPrepare(trainRatio));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="page-heading">Prepare Sequences</h1>
        <p className="text-sm text-slate-500 pl-3">
          Chronological split, MinMaxScaler, and 12-month LSTM sliding windows.
        </p>
      </div>

      <div className="section-card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">
            Train split ratio
          </label>
          <span className="text-sm font-bold text-blue-600 tabular-nums">
            {(trainRatio * 100).toFixed(0)}% / {((1 - trainRatio) * 100).toFixed(0)}%
          </span>
        </div>
        <input
          type="range"
          min={60}
          max={95}
          step={5}
          value={trainRatio * 100}
          onChange={(e) => setTrainRatio(Number(e.target.value) / 100)}
          className="w-full accent-blue-600"
        />
        <p className="text-xs text-slate-400">
          Split is chronological — no shuffling. Test set is the final{" "}
          {((1 - trainRatio) * 100).toFixed(0)}% of the time series.
        </p>
      </div>

      <RunButton onClick={handle} loading={loading} label="Run" />

      {error && <Alert type="error" message={error} />}

      {result && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Train windows" value={result.train_windows} />
            <Stat label="Test windows" value={result.test_windows} />
            <Stat label="Train rows" value={result.train_rows} />
            <Stat label="Test rows" value={result.test_rows} />
          </div>
          <Alert
            type="success"
            message={`Lookback = ${result.lookback} months | Train: ${result.train_range[0]} → ${result.train_range[1]} | Test: ${result.test_range[0]} → ${result.test_range[1]}`}
          />
        </>
      )}

      {!result && !error && (
        <Alert type="info" message='Choose a split ratio and click "Run" to prepare sequences.' />
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



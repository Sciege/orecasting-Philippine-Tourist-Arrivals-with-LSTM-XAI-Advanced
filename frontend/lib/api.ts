// lib/api.ts
// Central place for every fetch call to the FastAPI backend.

const BASE = "http://localhost:8000";

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

// --- Dataset ---
export interface DatasetResult {
  rows: number;
  columns: number;
  column_names: string[];
  date_min: string;
  date_max: string;
  missing_months: string[];
  preview: Record<string, string>[];
}
export const loadDataset = () => post<DatasetResult>("/dataset/load");

// --- Clean ---
export interface CleanResult {
  duplicates_removed: number;
  missing_before_impute: Record<string, number>;
  iqr_lower: number;
  iqr_upper: number;
  flagged_outliers: { date: string; arrivals: string }[];
  rows: number;
  columns: number;
}
export const runClean = () => post<CleanResult>("/clean/run");

// --- Features ---
export interface SpearmanRow {
  feature: string;
  rho: number;
  p_value: number;
}
export interface FeaturesResult {
  spearman_results: SpearmanRow[];
  vif_removals: { dropped: string; vif: number }[];
  selected_features: string[];
}
export const runFeatures = () => post<FeaturesResult>("/features/run");

// --- Prepare ---
export interface PrepareResult {
  train_ratio: number;
  train_rows: number;
  test_rows: number;
  train_range: [string, string];
  test_range: [string, string];
  train_windows: number;
  test_windows: number;
  lookback: number;
}
export const runPrepare = (train_ratio: number) =>
  post<PrepareResult>("/prepare/run", { train_ratio });

// --- Train ---
export interface TrainResult {
  best_params: { units: number; dropout: number; batch_size: number };
  val_loss: number;
  loss_history: number[];
  val_loss_history: number[];
}
export const runTrain = () => post<TrainResult>("/train/run");

// --- Evaluate ---
export interface Scores {
  MAE: number;
  RMSE: number;
  MAPE: number;
  R2: number;
}
export interface EvaluateResult {
  scores: { LSTM: Scores; Naive: Scores; "Seasonal naive": Scores };
  chart: { actual: number[]; predicted: number[] };
}
export const runEvaluate = () => post<EvaluateResult>("/evaluate/run");

// --- Explain ---
export interface ExplainResult {
  global_importance: Record<string, number>;
  one_forecast: Record<string, number>;
  top_feature: string;
  dependence: { value: number[]; shap: number[] };
}
export const runExplain = () => post<ExplainResult>("/explain/run");

// --- Forecast ---
export interface DefaultWindowResult {
  features: string[];
  window: Record<string, number>[];
}
export const getDefaultWindow = () =>
  get<DefaultWindowResult>("/forecast/default-window");

export interface ForecastResult {
  predicted_arrivals: number;
}
export const runForecast = (window: Record<string, number>[]) =>
  post<ForecastResult>("/forecast/run", { window });

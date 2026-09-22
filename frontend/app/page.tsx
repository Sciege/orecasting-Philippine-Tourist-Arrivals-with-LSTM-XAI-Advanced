// app/page.tsx
import Link from "next/link";

const steps = [
  {
    href: "/dataset",
    num: "01",
    label: "Dataset",
    desc: "Load tourist_arrivals.csv and inspect the monthly time series.",
  },
  {
    href: "/clean",
    num: "02",
    label: "Clean",
    desc: "Remove duplicates, one-hot encode categories, impute gaps, and flag IQR outliers.",
  },
  {
    href: "/features",
    num: "03",
    label: "Features",
    desc: "Spearman correlation filter followed by iterative VIF pruning.",
  },
  {
    href: "/prepare",
    num: "04",
    label: "Prepare",
    desc: "Chronological split, MinMaxScaler, and 12-month LSTM sliding windows.",
  },
  {
    href: "/train",
    num: "05",
    label: "Train",
    desc: "Grid-search over LSTM units, dropout, and batch size with early stopping.",
  },
  {
    href: "/evaluate",
    num: "06",
    label: "Evaluate",
    desc: "MAE / RMSE / MAPE / R² benchmarked against naive and seasonal-naive baselines.",
  },
  {
    href: "/explain",
    num: "07",
    label: "Explain",
    desc: "SHAP KernelExplainer — global importance and top-feature dependence plot.",
  },
  {
    href: "/forecast",
    num: "08",
    label: "Forecast",
    desc: "Edit the last 12 months of readings and predict next month's arrivals.",
  },
];

export default function Home() {
  return (
    <div className="max-w-3xl flex flex-col gap-8">
      {/* Hero */}
      <div className="flex flex-col gap-2 pt-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
          Philippines · LSTM Pipeline
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
          Tourist Arrivals<br className="hidden sm:block" /> Forecast
        </h1>
        <p className="text-slate-500 text-sm max-w-lg mt-1">
          Run each step in order. Every page builds on the result of the previous one — dataset → forecast in eight stages.
        </p>
      </div>

      {/* Step grid */}
      <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {steps.map(({ href, num, label, desc }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-5 py-4 hover:border-blue-400 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-semibold text-blue-600 tabular-nums">
                  {num}
                </span>
                <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                  {label}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </Link>
          </li>
        ))}
      </ol>

      {/* Note */}
      <p className="text-xs text-slate-400 border-t border-slate-200 pt-4">
        Backend: FastAPI on port 8000. Run steps 1–4 before training or forecasting.
      </p>
    </div>
  );
}


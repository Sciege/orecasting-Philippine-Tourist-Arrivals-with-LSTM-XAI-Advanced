// components/Sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const steps = [
  { href: "/",         label: "Home"         },
  { href: "/dataset",  label: "1 · Dataset"  },
  { href: "/clean",    label: "2 · Clean"    },
  { href: "/features", label: "3 · Features" },
  { href: "/prepare",  label: "4 · Prepare"  },
  { href: "/train",    label: "5 · Train"    },
  { href: "/evaluate", label: "6 · Evaluate" },
  { href: "/explain",  label: "7 · Explain"  },
  { href: "/forecast", label: "8 · Forecast" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-slate-900 flex flex-col min-h-screen">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 px-5 border-b border-slate-700/60">
        <span className="text-blue-400 text-lg leading-none">◉</span>
        <span className="text-sm font-bold text-white tracking-tight">
          PH Arrivals
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Pipeline
        </p>
        <ul className="flex flex-col gap-0.5">
          {steps.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={[
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white",
                  ].join(" ")}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-700/60">
        <p className="text-[10px] text-slate-600">ITD105 · LSTM Lab</p>
      </div>
    </aside>
  );
}


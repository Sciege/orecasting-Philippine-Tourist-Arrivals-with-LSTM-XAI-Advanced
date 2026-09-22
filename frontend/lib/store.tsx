// lib/store.tsx
// Global in-memory store for pipeline results.
// Lives outside the page component tree so navigation never resets it.
"use client";

import { createContext, useContext, useRef, ReactNode } from "react";
import type {
  DatasetResult,
  CleanResult,
  FeaturesResult,
  PrepareResult,
  TrainResult,
  EvaluateResult,
  ExplainResult,
  DefaultWindowResult,
} from "./api";

export interface PipelineStore {
  dataset:  DatasetResult | null;
  clean:    CleanResult   | null;
  features: FeaturesResult | null;
  prepare:  PrepareResult  | null;
  trainRatio: number;
  train:    TrainResult    | null;
  evaluate: EvaluateResult | null;
  explain:  ExplainResult  | null;
  forecastWindow:     DefaultWindowResult | null;
  forecastRows:       Record<string, number>[];
  forecastPrediction: number | null;
}

const defaultStore: PipelineStore = {
  dataset:  null,
  clean:    null,
  features: null,
  prepare:  null,
  trainRatio: 0.80,
  train:    null,
  evaluate: null,
  explain:  null,
  forecastWindow:     null,
  forecastRows:       [],
  forecastPrediction: null,
};

// Use a ref so the object reference is stable and mutations don't cause re-renders.
// Pages read the ref on mount (initialState) and write to it on success.
const StoreContext = createContext<React.MutableRefObject<PipelineStore> | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<PipelineStore>({ ...defaultStore });
  return (
    <StoreContext.Provider value={storeRef}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): React.MutableRefObject<PipelineStore> {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

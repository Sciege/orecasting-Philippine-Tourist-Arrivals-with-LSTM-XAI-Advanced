# routers/features.py
import numpy as np
from scipy.stats import spearmanr
from statsmodels.stats.outliers_influence import variance_inflation_factor
from fastapi import APIRouter, HTTPException

from state import pipeline

router = APIRouter()


@router.post("/run")
def run_features():
    """Spearman filter + iterative VIF pruning. Stores selected_features in pipeline."""
    if "clean_df" not in pipeline:
        raise HTTPException(status_code=400, detail="Run cleaning first (POST /clean/run).")

    df = pipeline["clean_df"]

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    candidates = [c for c in numeric_cols if c not in ["arrivals", "year", "month"]]

    # Step 1 — univariate Spearman filter
    results = []
    for col in candidates:
        rho, p_val = spearmanr(df[col], df["arrivals"], nan_policy="omit")
        results.append({"feature": col, "rho": float(rho), "p_value": float(p_val)})

    kept = [r["feature"] for r in results if abs(r["rho"]) > 0.10 and r["p_value"] < 0.05]

    if not kept:
        raise HTTPException(
            status_code=422,
            detail="No features passed the Spearman filter (|rho| > 0.10, p < 0.05).",
        )

    # Step 2 — iterative VIF pruning (threshold 5)
    X = df[kept].dropna().copy()
    vif_log = []

    while X.shape[1] > 1:
        vifs = [variance_inflation_factor(X.values, i) for i in range(X.shape[1])]
        max_vif = max(vifs)
        if max_vif < 5 or np.isnan(max_vif):
            break
        drop_col = X.columns[vifs.index(max_vif)]
        vif_log.append({"dropped": drop_col, "vif": float(max_vif)})
        X = X.drop(columns=[drop_col])

    selected = list(X.columns)
    pipeline["selected_features"] = selected

    return {
        "spearman_results": results,
        "vif_removals": vif_log,
        "selected_features": selected,
    }

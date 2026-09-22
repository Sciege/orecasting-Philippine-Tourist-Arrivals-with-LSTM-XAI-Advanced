# routers/clean.py
import pandas as pd
from fastapi import APIRouter, HTTPException

from state import pipeline

router = APIRouter()


@router.post("/run")
def run_clean():
    """Clean raw_df and store clean_df in pipeline state."""
    if "raw_df" not in pipeline:
        raise HTTPException(status_code=400, detail="Load the dataset first (POST /dataset/load).")

    df = pipeline["raw_df"].copy()

    # 1. Convert arrivals from formatted string with commas to float
    if df["arrivals"].dtype == "object":
        df["arrivals"] = df["arrivals"].astype(str).str.replace(",", "").astype(float)

    # 2. Remove duplicate dates
    duplicates_removed = int(df.duplicated(subset="date").sum())
    df = df.drop_duplicates(subset="date", keep="first")

    # 3. Track missing values before filling
    missing_series = df.isna().sum()
    missing_series = missing_series[missing_series > 0]
    missing_info = missing_series.to_dict()

    # 4. One-hot encode categorical seasonal columns
    for col in ["season", "monsoon"]:
        if col in df.columns:
            df = pd.get_dummies(df, columns=[col], drop_first=True, dtype=int)

    # 5. Impute missing values — forward then backward fill
    numeric_cols = df.select_dtypes(include=["number"]).columns
    df[numeric_cols] = df[numeric_cols].ffill().bfill()

    # 6. Flag IQR outliers on arrivals
    q1, q3 = df["arrivals"].quantile([0.25, 0.75])
    iqr = q3 - q1
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    flagged = df[(df["arrivals"] < lower) | (df["arrivals"] > upper)][["date", "arrivals"]]

    pipeline["clean_df"] = df

    return {
        "duplicates_removed": duplicates_removed,
        "missing_before_impute": missing_info,
        "iqr_lower": float(lower),
        "iqr_upper": float(upper),
        "flagged_outliers": flagged.astype(str).to_dict(orient="records"),
        "rows": len(df),
        "columns": len(df.columns),
    }

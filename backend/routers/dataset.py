# routers/dataset.py
import os
import pandas as pd
from fastapi import APIRouter, HTTPException

from state import pipeline

router = APIRouter()

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "tourist_arrivals.csv")


@router.post("/load")
def load_dataset():
    """Load tourist_arrivals.csv, store raw_df in pipeline state, return summary."""
    if not os.path.exists(DATA_PATH):
        raise HTTPException(status_code=404, detail=f"Data file not found at {DATA_PATH}")

    df = (
        pd.read_csv(DATA_PATH, skiprows=2, parse_dates=["date"])
        .sort_values("date")
        .reset_index(drop=True)
    )
    pipeline["raw_df"] = df

    expected = pd.date_range(df["date"].min(), df["date"].max(), freq="MS")
    missing_months = expected.difference(df["date"])

    return {
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": df.columns.tolist(),
        "date_min": str(df["date"].min().date()),
        "date_max": str(df["date"].max().date()),
        "missing_months": [str(m.date()) for m in missing_months],
        "preview": df.head(10).astype(str).to_dict(orient="records"),
    }

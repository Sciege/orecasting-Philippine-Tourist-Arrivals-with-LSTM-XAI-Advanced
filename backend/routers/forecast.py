# routers/forecast.py
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict

from state import pipeline

router = APIRouter()


class ForecastRequest(BaseModel):
    # 12 rows × N features — sent as a list of dicts keyed by feature name
    window: List[Dict[str, float]]


@router.get("/default-window")
def get_default_window():
    """Return the last training window in original (unscaled) units for pre-filling the form."""
    if "X_train_seq" not in pipeline:
        raise HTTPException(status_code=400, detail="Run prepare first (POST /prepare/run).")

    cols = pipeline["selected_features"]
    last_window_scaled = pipeline["X_train_seq"][-1]
    last_window = pipeline["scaler_X"].inverse_transform(last_window_scaled)

    rows = [dict(zip(cols, row.tolist())) for row in last_window]
    return {"features": cols, "window": rows}


@router.post("/run")
def run_forecast(body: ForecastRequest):
    """Accept an edited 12-month window and return the predicted arrivals count."""
    if "model" not in pipeline:
        raise HTTPException(status_code=400, detail="Train the model first (POST /train/run).")

    cols = pipeline["selected_features"]
    lookback = pipeline["X_train_seq"].shape[1]

    if len(body.window) != lookback:
        raise HTTPException(
            status_code=422,
            detail=f"Window must have exactly {lookback} rows; got {len(body.window)}.",
        )

    raw = np.array([[row[c] for c in cols] for row in body.window])
    X = pipeline["scaler_X"].transform(raw).reshape(1, lookback, len(cols))
    pred_scaled = pipeline["model"].predict(X)
    prediction = float(pipeline["scaler_y"].inverse_transform(pred_scaled)[0][0])

    return {"predicted_arrivals": round(prediction)}

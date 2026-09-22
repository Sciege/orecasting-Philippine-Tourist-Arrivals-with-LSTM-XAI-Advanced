# routers/evaluate.py
import numpy as np
from fastapi import APIRouter, HTTPException

from state import pipeline

router = APIRouter()

SEASONAL_PERIOD = 12


def score(actual, pred):
    mae = float(np.mean(np.abs(actual - pred)))
    rmse = float(np.sqrt(np.mean((actual - pred) ** 2)))
    mape = float(np.mean(np.abs((actual - pred) / actual)) * 100)
    ss_res = np.sum((actual - pred) ** 2)
    ss_tot = np.sum((actual - actual.mean()) ** 2)
    r2 = float(1 - ss_res / ss_tot)
    return {"MAE": mae, "RMSE": rmse, "MAPE": mape, "R2": r2}


@router.post("/run")
def run_evaluate():
    """Score LSTM vs naive and seasonal-naive baselines on the test set."""
    if "model" not in pipeline:
        raise HTTPException(status_code=400, detail="Train the model first (POST /train/run).")

    model = pipeline["model"]
    X_test_seq = pipeline["X_test_seq"]
    y_test_seq = pipeline["y_test_seq"]
    scaler_y = pipeline["scaler_y"]
    test_arrivals = pipeline["test_df"]["arrivals"].to_numpy()

    lookback = X_test_seq.shape[1]
    n_windows = len(X_test_seq)

    if lookback < SEASONAL_PERIOD:
        raise HTTPException(
            status_code=422,
            detail=f"Seasonal naive needs lookback ≥ {SEASONAL_PERIOD}; got {lookback}.",
        )

    pred_scaled = model.predict(X_test_seq)
    pred = scaler_y.inverse_transform(pred_scaled)
    actual = scaler_y.inverse_transform(y_test_seq)

    naive = np.array(
        [test_arrivals[i + lookback - 1] for i in range(n_windows)]
    ).reshape(-1, 1)

    seasonal_naive = np.array(
        [test_arrivals[i + lookback - SEASONAL_PERIOD] for i in range(n_windows)]
    ).reshape(-1, 1)

    lstm_scores = score(actual, pred)
    naive_scores = score(actual, naive)
    seasonal_scores = score(actual, seasonal_naive)

    # Also return actual vs predicted series for the chart
    actual_list = actual.flatten().tolist()
    pred_list = pred.flatten().tolist()

    return {
        "scores": {
            "LSTM": lstm_scores,
            "Naive": naive_scores,
            "Seasonal naive": seasonal_scores,
        },
        "chart": {
            "actual": [round(v) for v in actual_list],
            "predicted": [round(v) for v in pred_list],
        },
    }

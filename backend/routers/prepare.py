# routers/prepare.py
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from state import pipeline

router = APIRouter()

LOOKBACK = 12


def make_sequences(X, y, lookback):
    Xs, ys = [], []
    for i in range(len(X) - lookback):
        Xs.append(X[i : i + lookback])
        ys.append(y[i + lookback])
    return np.array(Xs), np.array(ys)


class PrepareRequest(BaseModel):
    train_ratio: float = 0.80


@router.post("/run")
def run_prepare(body: PrepareRequest):
    """Chronological split → scale (train only) → build LSTM sequences."""
    if "selected_features" not in pipeline:
        raise HTTPException(status_code=400, detail="Run feature selection first (POST /features/run).")

    train_ratio = body.train_ratio
    df = pipeline["clean_df"]
    split_idx = int(len(df) * train_ratio)
    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]

    cols = pipeline["selected_features"]

    scaler_X = MinMaxScaler().fit(train_df[cols])
    scaler_y = MinMaxScaler().fit(train_df[["arrivals"]])

    train_X = scaler_X.transform(train_df[cols])
    test_X = scaler_X.transform(test_df[cols])
    train_y = scaler_y.transform(train_df[["arrivals"]])
    test_y = scaler_y.transform(test_df[["arrivals"]])

    X_train_seq, y_train_seq = make_sequences(train_X, train_y, LOOKBACK)
    X_test_seq, y_test_seq = make_sequences(test_X, test_y, LOOKBACK)

    pipeline["scaler_X"] = scaler_X
    pipeline["scaler_y"] = scaler_y
    pipeline["X_train_seq"] = X_train_seq
    pipeline["y_train_seq"] = y_train_seq
    pipeline["X_test_seq"] = X_test_seq
    pipeline["y_test_seq"] = y_test_seq
    pipeline["test_df"] = test_df

    return {
        "train_ratio": train_ratio,
        "train_rows": len(train_df),
        "test_rows": len(test_df),
        "train_range": [str(train_df["date"].min().date()), str(train_df["date"].max().date())],
        "test_range": [str(test_df["date"].min().date()), str(test_df["date"].max().date())],
        "train_windows": len(X_train_seq),
        "test_windows": len(X_test_seq),
        "lookback": LOOKBACK,
    }

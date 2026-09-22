# routers/train.py
import itertools
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping
from fastapi import APIRouter, HTTPException

from state import pipeline

router = APIRouter()

PARAM_GRID = {"units": [32, 64], "dropout": [0.1, 0.3], "batch_size": [16, 32]}


@router.post("/run")
def run_train():
    """Grid-search over LSTM hyperparameters, keep best checkpoint by val_loss."""
    if "X_train_seq" not in pipeline:
        raise HTTPException(status_code=400, detail="Run prepare first (POST /prepare/run).")

    X_train = pipeline["X_train_seq"]
    y_train = pipeline["y_train_seq"]

    if len(X_train) == 0:
        raise HTTPException(status_code=422, detail="X_train_seq has 0 sequences. Adjust split ratio or lookback.")

    if np.isnan(X_train).any() or np.isnan(y_train).any():
        raise HTTPException(status_code=422, detail="Input data contains NaN. Re-run Clean and Prepare.")

    lookback = X_train.shape[1]
    n_features = X_train.shape[2]
    best_val_loss = float("inf")
    best_params = None
    best_model = None
    best_history = None

    for units, dropout, batch_size in itertools.product(*PARAM_GRID.values()):
        candidate = Sequential([
            Input(shape=(lookback, n_features)),
            LSTM(units),
            Dropout(dropout),
            Dense(1),
        ])
        candidate.compile(optimizer="adam", loss="mse")
        hist = candidate.fit(
            X_train, y_train,
            validation_split=0.15,
            epochs=100,
            batch_size=batch_size,
            callbacks=[EarlyStopping(patience=8, restore_best_weights=True)],
            verbose=0,
        )
        val_losses = [v for v in hist.history.get("val_loss", []) if not np.isnan(v)]
        if val_losses:
            val_loss = min(val_losses)
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                best_params = {"units": units, "dropout": dropout, "batch_size": batch_size}
                best_model = candidate
                best_history = hist.history

    if best_model is None:
        raise HTTPException(status_code=500, detail="Training failed — all runs returned NaN validation loss.")

    pipeline["model"] = best_model

    return {
        "best_params": best_params,
        "val_loss": float(best_val_loss),
        "loss_history": [float(v) for v in best_history["loss"]],
        "val_loss_history": [float(v) for v in best_history["val_loss"]],
    }

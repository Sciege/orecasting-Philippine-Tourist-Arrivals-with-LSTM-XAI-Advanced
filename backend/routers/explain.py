# routers/explain.py
import numpy as np
import shap
from fastapi import APIRouter, HTTPException

from state import pipeline

router = APIRouter()


@router.post("/run")
def run_explain():
    """SHAP KernelExplainer — global importance, per-forecast contributions, dependence plot."""
    if "model" not in pipeline:
        raise HTTPException(status_code=400, detail="Train the model first (POST /train/run).")

    X_train_seq = pipeline["X_train_seq"]
    X_test_seq = pipeline["X_test_seq"]
    features = pipeline["selected_features"]
    model = pipeline["model"]
    lookback = X_train_seq.shape[1]
    n_features = X_train_seq.shape[2]

    def predict_flat(flat_x):
        seq = flat_x.reshape(-1, lookback, n_features)
        return model.predict(seq, verbose=0).reshape(-1)

    background = X_train_seq[np.random.choice(len(X_train_seq), 50, replace=False)]
    background_summary = shap.kmeans(background.reshape(len(background), -1), 10)

    test_sample = X_test_seq[:20]
    explainer = shap.KernelExplainer(predict_flat, background_summary)
    shap_values = explainer.shap_values(
        test_sample.reshape(len(test_sample), -1), nsamples=100
    ).reshape(len(test_sample), lookback, n_features)

    mean_abs = np.abs(shap_values).mean(axis=(0, 1))
    top_idx = int(np.argmax(mean_abs))

    return {
        "global_importance": dict(zip(features, mean_abs.tolist())),
        "one_forecast": dict(zip(features, shap_values[0].sum(axis=0).tolist())),
        "top_feature": features[top_idx],
        "dependence": {
            "value": [float(X_test_seq[i, -1, top_idx]) for i in range(len(shap_values))],
            "shap": [float(shap_values[i][-1, top_idx]) for i in range(len(shap_values))],
        },
    }

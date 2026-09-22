# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import dataset, clean, features, prepare, train, evaluate, explain, forecast

app = FastAPI(title="Tourist Arrivals Forecast API", version="1.0.0")

# Allow the Next.js dev server (port 3000) to call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dataset.router,  prefix="/dataset",  tags=["dataset"])
app.include_router(clean.router,    prefix="/clean",    tags=["clean"])
app.include_router(features.router, prefix="/features", tags=["features"])
app.include_router(prepare.router,  prefix="/prepare",  tags=["prepare"])
app.include_router(train.router,    prefix="/train",    tags=["train"])
app.include_router(evaluate.router, prefix="/evaluate", tags=["evaluate"])
app.include_router(explain.router,  prefix="/explain",  tags=["explain"])
app.include_router(forecast.router, prefix="/forecast", tags=["forecast"])


@app.get("/")
def root():
    return {"status": "ok", "message": "Tourist Arrivals Forecast API"}

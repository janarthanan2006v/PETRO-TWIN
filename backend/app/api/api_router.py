from fastapi import APIRouter
from app.api.endpoints import (
    wells,
    telemetry,
    css,
    srp,
    dynamometer,
    predictions,
    simulation,
    optimization,
    recommendations,
    risks,
    models_registry
)

api_router = APIRouter()

api_router.include_router(wells.router, prefix="/wells", tags=["Wells"])
api_router.include_router(telemetry.router, prefix="/telemetry", tags=["Telemetry & Digital Twin"])
api_router.include_router(css.router, prefix="/css", tags=["CSS Analysis"])
api_router.include_router(srp.router, prefix="/srp", tags=["SRP Monitoring"])
api_router.include_router(dynamometer.router, prefix="/dynamometer", tags=["Dynamometer Cards"])
api_router.include_router(predictions.router, prefix="/predictions", tags=["AI Predictions & Explainability"])
api_router.include_router(simulation.router, prefix="/simulation", tags=["What-If Simulator"])
api_router.include_router(optimization.router, prefix="/optimization", tags=["Multi-Objective Optimization"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations & Audit"])
api_router.include_router(risks.router, prefix="/risks", tags=["Risk Alerts"])
api_router.include_router(models_registry.router, prefix="/models", tags=["Model Registry & Recalibration"])

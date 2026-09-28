from fastapi import APIRouter, Body
from app.ml.thermal_predictor import ThermalPredictorModel
from app.ml.production_predictor import ProductionPredictorModel
from app.ml.explainability import ModelExplainabilityEngine

router = APIRouter()
thermal_model = ThermalPredictorModel()
prod_model = ProductionPredictorModel()

@router.post("/forecast")
def get_ai_forecast(
    steam_volume_tonnes: float = Body(2300.0),
    steam_pressure_bar: float = Body(65.0),
    soak_days: float = Body(7.0),
    stroke_length_in: float = Body(100.0),
    spm: float = Body(6.5),
    cycle_day: float = Body(30.0)
):
    """
    Computes AI-driven forward predictions with uncertainty intervals and SHAP attribution.
    """
    # 1. Thermal & Viscosity Prediction
    thermal_res = thermal_model.predict(
        steam_volume_tonnes=steam_volume_tonnes,
        steam_pressure_bar=steam_pressure_bar,
        soak_days=soak_days,
        cycle_day=cycle_day
    )
    
    pred_temp = thermal_res["predicted_temp_c"]
    est_visc = thermal_res["estimated_viscosity_cp"]
    
    # 2. Production Rate Prediction
    prod_res = prod_model.predict(
        reservoir_temp_c=pred_temp,
        oil_viscosity_cp=est_visc,
        stroke_length_in=stroke_length_in,
        spm=spm,
        cycle_day=cycle_day,
        steam_volume_tonnes=steam_volume_tonnes
    )
    
    # 3. Explainability
    explanation = ModelExplainabilityEngine.explain_thermal_prediction(
        steam_volume_tonnes=steam_volume_tonnes,
        soak_days=soak_days,
        cycle_day=cycle_day,
        predicted_temp_c=pred_temp
    )
    
    # 4. SRP Risk Breakdown
    risk_expl = ModelExplainabilityEngine.explain_srp_risk(
        viscosity_cp=est_visc,
        spm=spm,
        stroke_length_in=stroke_length_in,
        fillage_pct=85.0,
        pprl_lbs=21500.0,
        mprl_lbs=6500.0
    )

    return {
        "inputs": {
            "steam_volume_tonnes": steam_volume_tonnes,
            "steam_pressure_bar": steam_pressure_bar,
            "soak_days": soak_days,
            "stroke_length_in": stroke_length_in,
            "spm": spm,
            "cycle_day": cycle_day
        },
        "thermal_prediction": thermal_res,
        "production_prediction": prod_res,
        "explainability": explanation,
        "risk_attribution": risk_expl
    }

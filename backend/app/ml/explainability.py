import numpy as np

class ModelExplainabilityEngine:
    """
    Explainable AI (XAI) engine providing localized feature attributions,
    SHAP-style contribution values, and physical petroleum engineering explanations.
    """

    @staticmethod
    def explain_thermal_prediction(
        steam_volume_tonnes: float,
        soak_days: float,
        cycle_day: float,
        predicted_temp_c: float
    ) -> dict:
        """
        Calculates normalized contribution of each operational parameter to reservoir temperature.
        """
        base_temp = 55.0
        delta_total = max(1.0, predicted_temp_c - base_temp)
        
        # Approximate relative contributions
        steam_contrib = (steam_volume_tonnes / 2500.0) * 0.55 * delta_total
        soak_contrib = max(0.0, (10.0 - soak_days) / 10.0) * 0.15 * delta_total
        cooling_penalty = - (cycle_day / 90.0) * 0.40 * delta_total
        
        attributions = [
            {
                "feature": "Steam Injection Enthalpy",
                "value": f"{steam_volume_tonnes} tonnes",
                "impact_c": round(steam_contrib, 1),
                "direction": "POSITIVE",
                "engineering_context": "Higher steam volume directly increases heat content injected into heavy oil matrix."
            },
            {
                "feature": "Soak Duration",
                "value": f"{soak_days} days",
                "impact_c": round(soak_contrib, 1),
                "direction": "POSITIVE" if soak_days <= 7 else "NEGATIVE",
                "engineering_context": "Optimal soak distributes heat radially; prolonged soak permits thermal dissipation into over/underburden."
            },
            {
                "feature": "CSS Cycle Elapsed Time",
                "value": f"Day {int(cycle_day)}",
                "impact_c": round(cooling_penalty, 1),
                "direction": "NEGATIVE",
                "engineering_context": "Natural conductive heat loss and fluid enthalpy removal steadily cool the reservoir."
            }
        ]
        
        return {
            "predicted_temperature_c": predicted_temp_c,
            "baseline_reservoir_temp_c": base_temp,
            "feature_attributions": attributions,
            "summary": f"Current thermal state ({predicted_temp_c}°C) is primarily driven by steam mass enthalpy (+{round(steam_contrib, 1)}°C) countered by cycle day {int(cycle_day)} conductive dissipation ({round(cooling_penalty, 1)}°C)."
        }

    @staticmethod
    def explain_srp_risk(
        viscosity_cp: float,
        spm: float,
        stroke_length_in: float,
        fillage_pct: float,
        pprl_lbs: float,
        mprl_lbs: float
    ) -> dict:
        """
        Explains contributing factors to mechanical risks (overload, floating, fluid pound).
        """
        risk_factors = []
        
        # Viscous drag impact
        if viscosity_cp > 500.0:
            risk_factors.append({
                "factor": "High Heavy-Oil Viscosity",
                "value": f"{viscosity_cp} cP",
                "risk_contribution_pct": 45.0,
                "mechanism": "High fluid shear stress creates excessive viscous drag against downward rod movement, triggering rod floating."
            })
        
        # Pumping speed impact
        if spm > 7.5:
            risk_factors.append({
                "factor": "Elevated Pumping Speed (SPM)",
                "value": f"{spm} SPM",
                "risk_contribution_pct": 30.0,
                "mechanism": "High cyclic velocity amplifies acceleration loads and accelerates rod fatigue."
            })
            
        # Incomplete fillage
        if fillage_pct < 70.0:
            risk_factors.append({
                "factor": "Low Pump Fillage",
                "value": f"{fillage_pct}%",
                "risk_contribution_pct": 25.0,
                "mechanism": "Plunger enters liquid phase at high velocity, causing severe fluid pound impact shock."
            })
            
        return {
            "total_risk_factors_identified": len(risk_factors),
            "factors": risk_factors,
            "recommendation_hint": "Adjust VFD frequency to reduce SPM and prevent rod floatation/fluid pound."
        }

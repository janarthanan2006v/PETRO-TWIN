from fastapi import APIRouter, Body
from app.physics.coupled_twin import CoupledWellToSurfaceDigitalTwin
from app.optimizer.safety_gate import SafetyGateEngine

router = APIRouter()
twin = CoupledWellToSurfaceDigitalTwin()

@router.post("/run-what-if")
def run_what_if_simulation(
    steam_volume_tonnes: float = Body(2200.0),
    steam_pressure_bar: float = Body(65.0),
    soak_days: float = Body(7.0),
    stroke_length_in: float = Body(100.0),
    spm: float = Body(6.5),
    cycle_duration_days: int = Body(90),
    baseline_steam_volume: float = Body(2200.0),
    baseline_spm: float = Body(6.5),
    baseline_stroke_length: float = Body(100.0)
):
    """
    Runs an interactive What-If scenario through the coupled physics engine
    and computes comparative delta improvements against the baseline scenario.
    """
    # 1. Run Scenario Simulation
    scenario_res = twin.simulate_css_production_cycle(
        steam_volume_tonnes=steam_volume_tonnes,
        steam_pressure_bar=steam_pressure_bar,
        soak_days=soak_days,
        stroke_length_in=stroke_length_in,
        spm=spm,
        cycle_duration_days=cycle_duration_days
    )
    
    # 2. Run Baseline Simulation for Comparison
    baseline_res = twin.simulate_css_production_cycle(
        steam_volume_tonnes=baseline_steam_volume,
        steam_pressure_bar=65.0,
        soak_days=7.0,
        stroke_length_in=baseline_stroke_length,
        spm=baseline_spm,
        cycle_duration_days=cycle_duration_days
    )
    
    # 3. Safety Gate Evaluation
    safety_eval = SafetyGateEngine.evaluate_configuration(
        steam_volume_tonnes=steam_volume_tonnes,
        steam_pressure_bar=steam_pressure_bar,
        soak_days=soak_days,
        stroke_length_in=stroke_length_in,
        spm=spm,
        sim_summary=scenario_res["summary"]
    )
    
    # 4. Deltas
    base_cum_oil = baseline_res["summary"]["cumulative_oil_bbl"]
    scen_cum_oil = scenario_res["summary"]["cumulative_oil_bbl"]
    oil_delta_bbl = scen_cum_oil - base_cum_oil
    oil_delta_pct = (oil_delta_bbl / max(1.0, base_cum_oil)) * 100.0
    
    base_sor = baseline_res["summary"]["steam_to_oil_ratio"]
    scen_sor = scenario_res["summary"]["steam_to_oil_ratio"]
    sor_delta = scen_sor - base_sor
    
    base_energy = baseline_res["summary"]["average_energy_kwh_per_bbl"]
    scen_energy = scenario_res["summary"]["average_energy_kwh_per_bbl"]
    energy_delta_pct = ((scen_energy - base_energy) / max(0.1, base_energy)) * 100.0

    return {
        "scenario_summary": scenario_res["summary"],
        "baseline_summary": baseline_res["summary"],
        "delta_comparison": {
            "cumulative_oil_gain_bbl": round(oil_delta_bbl, 1),
            "cumulative_oil_gain_pct": round(oil_delta_pct, 1),
            "sor_delta": round(sor_delta, 2),
            "energy_saving_pct": round(-energy_delta_pct, 1),
            "risk_score_delta": round(scenario_res["summary"]["average_risk_score"] - baseline_res["summary"]["average_risk_score"], 1)
        },
        "safety_audit": safety_eval,
        "daily_trajectory": scenario_res["daily_trajectory"],
        "dynamometer_card": scenario_res["representative_dynamometer_card"]
    }

import pytest
from app.physics.reservoir_thermal import HeavyOilReservoirThermalModel
from app.physics.wellbore_flow import WellboreFlowModel
from app.physics.srp_mechanics import SuckerRodPumpMechanicsModel
from app.physics.dynamometer import DynamometerCardGenerator
from app.physics.coupled_twin import CoupledWellToSurfaceDigitalTwin
from app.ml.thermal_predictor import ThermalPredictorModel
from app.ml.production_predictor import ProductionPredictorModel
from app.ml.dyno_classifier import DynamometerCardClassifier
from app.optimizer.nsga2_engine import MultiObjectiveOptimizer
from app.optimizer.safety_gate import SafetyGateEngine

def test_reservoir_thermal_model():
    model = HeavyOilReservoirThermalModel(api_gravity=14.5, initial_res_temp_c=55.0)
    
    # Test Peak Temperature Rise
    peak_temp = model.calculate_peak_heated_temperature(steam_volume_tonnes=2200.0, soak_days=7.0)
    assert 130.0 <= peak_temp <= 270.0, f"Peak temp {peak_temp} out of physical bounds"
    
    # Test Viscosity Reduction
    cold_visc = model.calculate_viscosity_cp(55.0)
    hot_visc = model.calculate_viscosity_cp(peak_temp)
    assert cold_visc > 1000.0, f"Cold heavy oil viscosity {cold_visc} should be > 1000 cP"
    assert hot_visc < 150.0, f"Hot oil viscosity {hot_visc} should be drastically reduced"
    assert hot_visc < cold_visc, "Hot viscosity must be lower than cold viscosity"

def test_wellbore_hydraulics():
    wellbore = WellboreFlowModel(depth_m=1100.0)
    
    wh_temp = wellbore.calculate_wellhead_temperature(bottomhole_temp_c=160.0, total_liquid_rate_bpd=200.0)
    assert 35.0 <= wh_temp <= 160.0, f"Wellhead temp {wh_temp} out of bounds"
    
    hyd = wellbore.calculate_wellbore_pressure_drop(
        bottomhole_temp_c=160.0,
        oil_rate_bpd=160.0,
        water_rate_bpd=40.0,
        average_viscosity_cp=80.0
    )
    assert hyd["hydrostatic_pressure_bar"] > 50.0, "Hydrostatic head must be positive"
    assert hyd["total_pressure_drop_bar"] > hyd["hydrostatic_pressure_bar"]

def test_srp_mechanics_and_rod_loads():
    srp = SuckerRodPumpMechanicsModel(
        plunger_diameter_in=2.25,
        pump_depth_m=1100.0,
        rod_rating_lbs=28000.0
    )
    
    disp = srp.calculate_theoretical_displacement(stroke_length_in=100.0, spm=6.5)
    assert disp > 0.0, "Displacement must be positive"
    
    loads = srp.calculate_rod_loads(
        stroke_length_in=100.0,
        spm=6.5,
        fluid_viscosity_cp=95.0
    )
    assert loads["pprl_lbs"] > loads["mprl_lbs"], "PPRL must exceed MPRL"
    assert loads["rod_load_pct"] > 0.0

def test_dynamometer_card_generation():
    gen = DynamometerCardGenerator(num_points=100)
    card = gen.generate_card(
        stroke_length_in=100.0,
        spm=6.5,
        pprl_lbs=21000.0,
        mprl_lbs=6500.0,
        fluid_viscosity_cp=95.0,
        fillage_pct=85.0,
        fault_type="NORMAL_OPERATION"
    )
    
    assert len(card["surface_position_in"]) == 100
    assert len(card["surface_load_lbs"]) == 100
    assert len(card["pump_position_in"]) == 100
    assert len(card["pump_load_lbs"]) == 100
    assert card["diagnostic_label"] == "NORMAL_OPERATION"

def test_coupled_digital_twin_simulation():
    twin = CoupledWellToSurfaceDigitalTwin()
    sim = twin.simulate_css_production_cycle(
        steam_volume_tonnes=2200.0,
        steam_pressure_bar=65.0,
        soak_days=7.0,
        stroke_length_in=100.0,
        spm=6.5,
        cycle_duration_days=60
    )
    
    assert len(sim["daily_trajectory"]) == 60
    assert sim["summary"]["cumulative_oil_bbl"] > 1000.0
    assert sim["summary"]["steam_to_oil_ratio"] > 0.0

def test_ai_models_and_classifier():
    # 1. Thermal Predictor
    thermal_ml = ThermalPredictorModel()
    metrics_t = thermal_ml.train_baseline()
    assert metrics_t["r2_score"] > 0.90, f"Thermal model R2 score {metrics_t['r2_score']} too low"
    
    pred_t = thermal_ml.predict(2200.0, 65.0, 7.0, 30.0)
    assert 55.0 <= pred_t["predicted_temp_c"] <= 260.0
    
    # 2. Dyno Morphological Classifier
    dyno_ml = DynamometerCardClassifier()
    metrics_d = dyno_ml.train_baseline()
    assert metrics_d["accuracy"] > 0.90, f"Classifier accuracy {metrics_d['accuracy']} too low"

def test_safety_gate():
    safe_eval = SafetyGateEngine.evaluate_configuration(
        steam_volume_tonnes=2200.0,
        steam_pressure_bar=65.0,
        soak_days=7.0,
        stroke_length_in=100.0,
        spm=6.5,
        sim_summary={"max_rod_load_pct": 74.0, "is_rod_floating_detected": False}
    )
    assert safe_eval["is_safe"] is True
    assert safe_eval["safety_score"] > 80.0

    unsafe_eval = SafetyGateEngine.evaluate_configuration(
        steam_volume_tonnes=3500.0,
        steam_pressure_bar=95.0,  # exceeds 80 bar limit
        soak_days=2.0,
        stroke_length_in=144.0,
        spm=14.0,  # exceeds 11.5 SPM unit limit
        sim_summary={"max_rod_load_pct": 96.0, "is_rod_floating_detected": True}
    )
    assert unsafe_eval["is_safe"] is False
    assert len(unsafe_eval["violations"]) > 0

def test_nsga2_optimizer():
    opt = MultiObjectiveOptimizer()
    res = opt.run_pareto_optimization(population_size=12, generations=2)
    assert len(res["pareto_solutions"]) > 0
    assert res["recommended_optimal"] is not None

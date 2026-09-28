import datetime
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.db.models import (
    Well, CSSCycle, ProductionRecord, SRPRecord, DynamometerCard,
    Recommendation, OperatorAction, RiskAlert, ModelVersion
)
from app.physics.coupled_twin import CoupledWellToSurfaceDigitalTwin
from app.physics.dynamometer import DynamometerCardGenerator

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # Check if already seeded
    if db.query(Well).first():
        print("Database already contains records. Skipping initial seeding.")
        db.close()
        return

    print("Seeding PETRO-TWIN heavy-oil database...")
    twin = CoupledWellToSurfaceDigitalTwin()
    dyno_gen = DynamometerCardGenerator()

    # 1. Create Wells (Rajasthan / Baghewala Context)
    wells_data = [
        {
            "id": "well-bw-01",
            "name": "BW-01 (Baghewala Heavy Oil)",
            "field_location": "Baghewala Field, Bikaner-Nagaur Basin",
            "status": "PRODUCING",
            "api_gravity": 14.5,
            "reservoir_depth_m": 1100.0,
            "initial_res_temp_c": 55.0,
            "current_res_temp_c": 148.5,
            "oil_viscosity_cp": 95.0,
            "plunger_diameter_in": 2.25,
            "rod_rating_lbs": 28000.0
        },
        {
            "id": "well-bw-04",
            "name": "BW-04 (Thermal Pilot)",
            "field_location": "Baghewala Field, Rajasthan",
            "status": "PRODUCING",
            "api_gravity": 13.8,
            "reservoir_depth_m": 1150.0,
            "initial_res_temp_c": 54.0,
            "current_res_temp_c": 162.0,
            "oil_viscosity_cp": 72.0,
            "plunger_diameter_in": 2.25,
            "rod_rating_lbs": 30000.0
        },
        {
            "id": "well-bw-09",
            "name": "BW-09 (CSS Cycle 3)",
            "field_location": "Baghewala Field, Rajasthan",
            "status": "SOAKING",
            "api_gravity": 15.1,
            "reservoir_depth_m": 1080.0,
            "initial_res_temp_c": 56.0,
            "current_res_temp_c": 195.0,
            "oil_viscosity_cp": 38.0,
            "plunger_diameter_in": 2.00,
            "rod_rating_lbs": 26000.0
        },
        {
            "id": "well-bw-12",
            "name": "BW-12 (Mature Thermal)",
            "field_location": "Baghewala North, Rajasthan",
            "status": "PRODUCING",
            "api_gravity": 14.0,
            "reservoir_depth_m": 1120.0,
            "initial_res_temp_c": 55.0,
            "current_res_temp_c": 110.0,
            "oil_viscosity_cp": 380.0,
            "plunger_diameter_in": 2.50,
            "rod_rating_lbs": 28000.0
        }
    ]

    wells_objs = []
    for w in wells_data:
        well_obj = Well(**w)
        db.add(well_obj)
        wells_objs.append(well_obj)
    db.commit()

    # 2. Add CSS Cycles, Production & SRP records for BW-01
    primary_well = wells_objs[0]
    
    # CSS Cycles 1 & 2
    c1 = CSSCycle(
        well_id=primary_well.id,
        cycle_number=1,
        injection_days=15.0,
        soak_days=8.0,
        steam_volume_tonnes=2000.0,
        steam_pressure_bar=62.0,
        steam_temp_c=275.0,
        steam_quality=0.74,
        peak_bottomhole_temp_c=185.0,
        status="COMPLETED"
    )
    c2 = CSSCycle(
        well_id=primary_well.id,
        cycle_number=2,
        injection_days=14.0,
        soak_days=7.0,
        steam_volume_tonnes=2300.0,
        steam_pressure_bar=66.0,
        steam_temp_c=282.0,
        steam_quality=0.78,
        peak_bottomhole_temp_c=198.0,
        status="ACTIVE"
    )
    db.add(c1)
    db.add(c2)
    db.commit()

    # Generate 60 days of telemetry for BW-01
    sim = twin.simulate_css_production_cycle(
        steam_volume_tonnes=2300.0,
        steam_pressure_bar=66.0,
        soak_days=7.0,
        stroke_length_in=100.0,
        spm=6.5,
        cycle_duration_days=60
    )

    base_date = datetime.datetime.utcnow() - datetime.timedelta(days=60)
    for row in sim["daily_trajectory"]:
        rec_time = base_date + datetime.timedelta(days=row["day"])
        
        # Production Record
        p_rec = ProductionRecord(
            well_id=primary_well.id,
            timestamp=rec_time,
            cycle_day=float(row["day"]),
            oil_rate_bpd=row["oil_rate_bpd"],
            water_rate_bpd=row["water_rate_bpd"],
            fluid_rate_bpd=round(row["oil_rate_bpd"] + row["water_rate_bpd"], 2),
            wellhead_temp_c=row["wellhead_temp_c"],
            bottomhole_temp_c=row["reservoir_temp_c"],
            bottomhole_pressure_bar=round(45.0 - row["day"] * 0.15, 2),
            oil_viscosity_cp=row["viscosity_cp"],
            steam_to_oil_ratio=row["sor"]
        )
        db.add(p_rec)

        # SRP Record
        s_rec = SRPRecord(
            well_id=primary_well.id,
            timestamp=rec_time,
            spm=6.5,
            stroke_length_in=100.0,
            pprl_lbs=row["pprl_lbs"],
            mprl_lbs=row["mprl_lbs"],
            motor_power_kw=row["motor_power_kw"],
            energy_kwh_per_bbl=row["energy_kwh_per_bbl"],
            pump_fillage_pct=row["fillage_pct"],
            rod_load_pct=row["rod_load_pct"],
            vfd_frequency_hz=48.0
        )
        db.add(s_rec)
    db.commit()

    # 3. Create Representative Dynamometer Cards
    card_types = [
        ("NORMAL_OPERATION", 100.0, 6.5, 21500.0, 6500.0, 95.0, 88.0),
        ("FLUID_POUND", 120.0, 8.5, 24000.0, 4800.0, 110.0, 52.0),
        ("GAS_INTERFERENCE", 100.0, 6.0, 19800.0, 5500.0, 80.0, 75.0),
        ("ROD_FLOATING", 100.0, 7.0, 18500.0, 800.0, 1800.0, 80.0),
        ("WORN_TRAVELING_VALVE", 100.0, 5.5, 17200.0, 6000.0, 120.0, 82.0),
        ("MECHANICAL_OVERLOAD", 144.0, 9.5, 28800.0, 7200.0, 140.0, 92.0),
    ]

    for fault, stroke, spm_val, pprl, mprl, visc, fillage in card_types:
        card_data = dyno_gen.generate_card(
            stroke_length_in=stroke,
            spm=spm_val,
            pprl_lbs=pprl,
            mprl_lbs=mprl,
            fluid_viscosity_cp=visc,
            fillage_pct=fillage,
            fault_type=fault
        )
        d_card = DynamometerCard(
            well_id=primary_well.id,
            timestamp=datetime.datetime.utcnow(),
            card_type="SURFACE_AND_DOWNHOLE",
            stroke_length_in=stroke,
            spm=spm_val,
            surface_position_in=card_data["surface_position_in"],
            surface_load_lbs=card_data["surface_load_lbs"],
            pump_position_in=card_data["pump_position_in"],
            pump_load_lbs=card_data["pump_load_lbs"],
            diagnostic_label=fault,
            fault_confidence=card_data["fault_confidence"],
            notes=f"Synthesized benchmark card for {fault} diagnostic testing."
        )
        db.add(d_card)
    db.commit()

    # 4. Create Initial Operational Recommendations
    rec1 = Recommendation(
        id="rec-opt-001",
        well_id=primary_well.id,
        created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=4),
        rec_steam_volume=2550.0,
        rec_soak_days=6.0,
        rec_stroke_length=120.0,
        rec_spm=5.8,
        expected_oil_gain_bpd=34.2,
        expected_sor_reduction=0.38,
        expected_energy_saving_pct=16.5,
        safety_score=96.0,
        risk_level="LOW",
        approval_status="PENDING_REVIEW",
        engineering_rationale="NSGA-II multi-objective optimization indicates increasing stroke length to 120 inches while lowering SPM to 5.8 increases displacement volume by 22% while reducing peak cyclic rod acceleration and avoiding rod floating risk under current cooling trajectory.",
        pareto_rank=1
    )
    db.add(rec1)

    rec2 = Recommendation(
        id="rec-opt-002",
        well_id=primary_well.id,
        created_at=datetime.datetime.utcnow() - datetime.timedelta(days=2),
        rec_steam_volume=2200.0,
        rec_soak_days=7.0,
        rec_stroke_length=100.0,
        rec_spm=6.5,
        expected_oil_gain_bpd=18.5,
        expected_sor_reduction=0.22,
        expected_energy_saving_pct=9.2,
        safety_score=92.5,
        risk_level="LOW",
        approval_status="APPROVED",
        engineering_rationale="Baseline thermal cycle operating configuration verified by production engineering team.",
        pareto_rank=2
    )
    db.add(rec2)

    # Operator Action for rec2
    op_act = OperatorAction(
        recommendation_id=rec2.id,
        operator_id="Er. R. Sharma (Chief Petroleum Eng.)",
        action="APPROVED",
        notes="Approved for Cycle 2 production phase. Target stroke set to 100 in, 6.5 SPM on VFD.",
        timestamp=datetime.datetime.utcnow() - datetime.timedelta(days=2)
    )
    db.add(op_act)

    # 5. Create Active Risk Alerts
    alert1 = RiskAlert(
        well_id=primary_well.id,
        timestamp=datetime.datetime.utcnow() - datetime.timedelta(hours=6),
        severity="MEDIUM",
        alert_type="ROD_FLOATING_PROXIMITY",
        description="Downstroke polished rod load approaching minimum threshold (MPRL = 2,400 lbs). Increased heavy-oil viscous drag observed as wellhead temperature cooled to 72°C.",
        contributing_parameters={"viscosity_cp": 320.0, "mprl_lbs": 2400.0, "wellhead_temp_c": 72.0},
        is_resolved=False
    )
    db.add(alert1)

    # 6. Model Versions Registry
    m1 = ModelVersion(
        model_name="XGB-Thermal-Predictor",
        version="v1.4.2",
        mae=1.84,
        rmse=2.45,
        r2=0.9782,
        status="ACTIVE",
        hyperparameters={"n_estimators": 100, "learning_rate": 0.08, "max_depth": 4}
    )
    m2 = ModelVersion(
        model_name="RF-Dyno-Fault-Classifier",
        version="v2.1.0",
        mae=0.03,
        rmse=0.05,
        r2=0.9850,
        status="ACTIVE",
        hyperparameters={"n_estimators": 100, "criterion": "gini", "max_features": "sqrt"}
    )
    db.add(m1)
    db.add(m2)

    db.commit()
    db.close()
    print("PETRO-TWIN Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()

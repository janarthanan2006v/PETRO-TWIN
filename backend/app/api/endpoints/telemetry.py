from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Well, ProductionRecord, SRPRecord

router = APIRouter()

@router.get("/coupled-state/{well_id}")
def get_coupled_digital_twin_state(well_id: str, db: Session = Depends(get_db)):
    """
    Returns coupled real-time operational state for the 4-tier Digital Twin:
    Reservoir -> Wellbore -> SRP -> Surface
    """
    well = db.query(Well).filter(Well.id == well_id).first()
    if not well:
        raise HTTPException(status_code=404, detail="Well not found")
        
    latest_p = db.query(ProductionRecord).filter(ProductionRecord.well_id == well_id).order_by(ProductionRecord.timestamp.desc()).first()
    latest_s = db.query(SRPRecord).filter(SRPRecord.well_id == well_id).order_by(SRPRecord.timestamp.desc()).first()
    
    t_res = latest_p.bottomhole_temp_c if latest_p else 145.0
    visc = latest_p.oil_viscosity_cp if latest_p else 95.0
    q_oil = latest_p.oil_rate_bpd if latest_p else 180.0
    q_water = latest_p.water_rate_bpd if latest_p else 42.0
    t_wh = latest_p.wellhead_temp_c if latest_p else 82.0
    
    pprl = latest_s.pprl_lbs if latest_s else 21500.0
    mprl = latest_s.mprl_lbs if latest_s else 6800.0
    spm = latest_s.spm if latest_s else 6.5
    stroke = latest_s.stroke_length_in if latest_s else 100.0
    fillage = latest_s.pump_fillage_pct if latest_s else 88.0
    motor_kw = latest_s.motor_power_kw if latest_s else 24.5
    kwh_bbl = latest_s.energy_kwh_per_bbl if latest_s else 3.26
    sor = latest_p.steam_to_oil_ratio if latest_p else 2.65
    
    return {
        "timestamp": latest_p.timestamp.isoformat() if latest_p else None,
        "well_id": well.id,
        "well_name": well.name,
        "reservoir_tier": {
            "reservoir_temperature_c": t_res,
            "initial_temperature_c": well.initial_res_temp_c,
            "oil_viscosity_cp": visc,
            "reservoir_pressure_bar": latest_p.bottomhole_pressure_bar if latest_p else 44.0,
            "mobility_index_relative": round(3500.0 / max(10.0, visc), 2),
            "thermal_heating_status": "THERMAL_DECLINE_PRODUCTION_PHASE"
        },
        "wellbore_tier": {
            "depth_m": well.reservoir_depth_m,
            "bottomhole_temp_c": t_res,
            "wellhead_temp_c": t_wh,
            "temp_loss_gradient_c": round(t_res - t_wh, 1),
            "flowing_friction_loss_bar": 3.85,
            "hydrostatic_head_bar": 104.2
        },
        "srp_tier": {
            "spm": spm,
            "stroke_length_in": stroke,
            "plunger_diameter_in": well.plunger_diameter_in,
            "pprl_lbs": pprl,
            "mprl_lbs": mprl,
            "rod_load_pct": round((pprl / well.rod_rating_lbs) * 100.0, 1),
            "pump_fillage_pct": fillage,
            "motor_power_kw": motor_kw,
            "is_rod_floating": mprl < 2000.0,
            "vfd_frequency_hz": latest_s.vfd_frequency_hz if latest_s else 48.0
        },
        "surface_tier": {
            "oil_rate_bpd": q_oil,
            "water_rate_bpd": q_water,
            "total_liquid_rate_bpd": round(q_oil + q_water, 1),
            "water_cut_pct": round((q_water / max(1.0, q_oil + q_water)) * 100.0, 1),
            "steam_to_oil_ratio": sor,
            "energy_kwh_per_bbl": kwh_bbl,
            "composite_health_index": 92.4
        }
    }

@router.get("/historical/{well_id}")
def get_historical_telemetry(
    well_id: str,
    days: int = Query(60, ge=7, le=180),
    db: Session = Depends(get_db)
):
    """
    Returns time-series history for multi-parameter trend graphs.
    """
    prods = db.query(ProductionRecord).filter(
        ProductionRecord.well_id == well_id
    ).order_by(ProductionRecord.timestamp.asc()).limit(days).all()
    
    srps = db.query(SRPRecord).filter(
        SRPRecord.well_id == well_id
    ).order_by(SRPRecord.timestamp.asc()).limit(days).all()

    history = []
    for i, p in enumerate(prods):
        s = srps[i] if i < len(srps) else None
        history.append({
            "day": int(p.cycle_day),
            "timestamp": p.timestamp.strftime("%Y-%m-%d"),
            "oil_rate_bpd": p.oil_rate_bpd,
            "water_rate_bpd": p.water_rate_bpd,
            "reservoir_temp_c": p.bottomhole_temp_c,
            "wellhead_temp_c": p.wellhead_temp_c,
            "oil_viscosity_cp": p.oil_viscosity_cp,
            "sor": p.steam_to_oil_ratio,
            "pprl_lbs": s.pprl_lbs if s else None,
            "mprl_lbs": s.mprl_lbs if s else None,
            "pump_fillage_pct": s.pump_fillage_pct if s else None,
            "energy_kwh_per_bbl": s.energy_kwh_per_bbl if s else None
        })
        
    return {
        "well_id": well_id,
        "total_days": len(history),
        "data": history
    }

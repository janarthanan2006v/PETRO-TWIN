from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Well, CSSCycle, ProductionRecord, SRPRecord

router = APIRouter()

@router.get("/")
def get_wells(db: Session = Depends(get_db)):
    wells = db.query(Well).all()
    return [{
        "id": w.id,
        "name": w.name,
        "field_location": w.field_location,
        "status": w.status,
        "api_gravity": w.api_gravity,
        "reservoir_depth_m": w.reservoir_depth_m,
        "initial_res_temp_c": w.initial_res_temp_c,
        "current_res_temp_c": w.current_res_temp_c,
        "oil_viscosity_cp": w.oil_viscosity_cp,
        "plunger_diameter_in": w.plunger_diameter_in,
        "rod_rating_lbs": w.rod_rating_lbs,
        "created_at": w.created_at.isoformat() if w.created_at else None
    } for w in wells]

@router.get("/{well_id}")
def get_well_detail(well_id: str, db: Session = Depends(get_db)):
    well = db.query(Well).filter(Well.id == well_id).first()
    if not well:
        raise HTTPException(status_code=404, detail="Well not found")
        
    latest_prod = db.query(ProductionRecord).filter(ProductionRecord.well_id == well_id).order_by(ProductionRecord.timestamp.desc()).first()
    latest_srp = db.query(SRPRecord).filter(SRPRecord.well_id == well_id).order_by(SRPRecord.timestamp.desc()).first()
    active_cycle = db.query(CSSCycle).filter(CSSCycle.well_id == well_id, CSSCycle.status == "ACTIVE").first()

    return {
        "well": {
            "id": well.id,
            "name": well.name,
            "field_location": well.field_location,
            "status": well.status,
            "api_gravity": well.api_gravity,
            "reservoir_depth_m": well.reservoir_depth_m,
            "initial_res_temp_c": well.initial_res_temp_c,
            "current_res_temp_c": well.current_res_temp_c,
            "oil_viscosity_cp": well.oil_viscosity_cp,
            "plunger_diameter_in": well.plunger_diameter_in,
            "rod_rating_lbs": well.rod_rating_lbs
        },
        "latest_production": {
            "oil_rate_bpd": latest_prod.oil_rate_bpd if latest_prod else 0.0,
            "water_rate_bpd": latest_prod.water_rate_bpd if latest_prod else 0.0,
            "wellhead_temp_c": latest_prod.wellhead_temp_c if latest_prod else 0.0,
            "bottomhole_temp_c": latest_prod.bottomhole_temp_c if latest_prod else 0.0,
            "bottomhole_pressure_bar": latest_prod.bottomhole_pressure_bar if latest_prod else 0.0,
            "sor": latest_prod.steam_to_oil_ratio if latest_prod else 0.0
        } if latest_prod else None,
        "latest_srp": {
            "spm": latest_srp.spm if latest_srp else 0.0,
            "stroke_length_in": latest_srp.stroke_length_in if latest_srp else 0.0,
            "pprl_lbs": latest_srp.pprl_lbs if latest_srp else 0.0,
            "mprl_lbs": latest_srp.mprl_lbs if latest_srp else 0.0,
            "motor_power_kw": latest_srp.motor_power_kw if latest_srp else 0.0,
            "energy_kwh_per_bbl": latest_srp.energy_kwh_per_bbl if latest_srp else 0.0,
            "pump_fillage_pct": latest_srp.pump_fillage_pct if latest_srp else 0.0,
            "rod_load_pct": latest_srp.rod_load_pct if latest_srp else 0.0
        } if latest_srp else None,
        "active_css_cycle": {
            "cycle_number": active_cycle.cycle_number if active_cycle else 2,
            "steam_volume_tonnes": active_cycle.steam_volume_tonnes if active_cycle else 2300.0,
            "steam_pressure_bar": active_cycle.steam_pressure_bar if active_cycle else 66.0,
            "soak_days": active_cycle.soak_days if active_cycle else 7.0
        } if active_cycle else None
    }

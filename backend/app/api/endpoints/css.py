from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Well, CSSCycle

router = APIRouter()

@router.get("/cycles/{well_id}")
def get_css_cycles(well_id: str, db: Session = Depends(get_db)):
    cycles = db.query(CSSCycle).filter(CSSCycle.well_id == well_id).order_by(CSSCycle.cycle_number.asc()).all()
    return [{
        "id": c.id,
        "cycle_number": c.cycle_number,
        "injection_start": c.injection_start.isoformat() if c.injection_start else None,
        "injection_days": c.injection_days,
        "soak_days": c.soak_days,
        "steam_volume_tonnes": c.steam_volume_tonnes,
        "steam_pressure_bar": c.steam_pressure_bar,
        "steam_temp_c": c.steam_temp_c,
        "steam_quality": c.steam_quality,
        "peak_bottomhole_temp_c": c.peak_bottomhole_temp_c,
        "status": c.status
    } for c in cycles]

@router.get("/thermal-efficiency/{well_id}")
def get_thermal_efficiency_kpis(well_id: str, db: Session = Depends(get_db)):
    well = db.query(Well).filter(Well.id == well_id).first()
    if not well:
        raise HTTPException(status_code=404, detail="Well not found")
        
    return {
        "well_name": well.name,
        "current_temperature_c": well.current_res_temp_c,
        "initial_temperature_c": well.initial_res_temp_c,
        "temperature_gain_c": round(well.current_res_temp_c - well.initial_res_temp_c, 1),
        "thermal_retention_pct": 74.2,
        "estimated_heated_radius_m": 42.5,
        "viscosity_reduction_factor": round(3500.0 / max(10.0, well.oil_viscosity_cp), 1),
        "cumulative_steam_injected_tonnes": 4300.0
    }

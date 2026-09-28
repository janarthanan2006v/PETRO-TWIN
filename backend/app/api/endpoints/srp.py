from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Well, SRPRecord

router = APIRouter()

@router.get("/status/{well_id}")
def get_srp_monitoring_status(well_id: str, db: Session = Depends(get_db)):
    well = db.query(Well).filter(Well.id == well_id).first()
    if not well:
        raise HTTPException(status_code=404, detail="Well not found")
        
    latest_srp = db.query(SRPRecord).filter(SRPRecord.well_id == well_id).order_by(SRPRecord.timestamp.desc()).first()
    if not latest_srp:
        raise HTTPException(status_code=404, detail="No SRP telemetry recorded")

    is_rod_floating = latest_srp.mprl_lbs < 2000.0
    is_overloaded = latest_srp.rod_load_pct > 90.0
    is_fluid_pound = latest_srp.pump_fillage_pct < 65.0

    return {
        "well_id": well.id,
        "well_name": well.name,
        "rod_rating_lbs": well.rod_rating_lbs,
        "plunger_diameter_in": well.plunger_diameter_in,
        "spm": latest_srp.spm,
        "stroke_length_in": latest_srp.stroke_length_in,
        "pprl_lbs": latest_srp.pprl_lbs,
        "mprl_lbs": latest_srp.mprl_lbs,
        "rod_load_pct": latest_srp.rod_load_pct,
        "pump_fillage_pct": latest_srp.pump_fillage_pct,
        "motor_power_kw": latest_srp.motor_power_kw,
        "energy_kwh_per_bbl": latest_srp.energy_kwh_per_bbl,
        "vfd_frequency_hz": latest_srp.vfd_frequency_hz,
        "health_status": "FAULT_RISK" if (is_rod_floating or is_overloaded or is_fluid_pound) else "OPTIMAL",
        "active_diagnostics": {
            "rod_floating_risk": is_rod_floating,
            "mechanical_overload_risk": is_overloaded,
            "fluid_pound_risk": is_fluid_pound
        }
    }

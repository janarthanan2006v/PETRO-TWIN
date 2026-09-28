from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import RiskAlert, Well

router = APIRouter()

@router.get("/alerts/{well_id}")
def get_risk_alerts(well_id: str, db: Session = Depends(get_db)):
    alerts = db.query(RiskAlert).filter(RiskAlert.well_id == well_id).order_by(RiskAlert.timestamp.desc()).all()
    return [{
        "id": a.id,
        "timestamp": a.timestamp.isoformat() if a.timestamp else None,
        "severity": a.severity,
        "alert_type": a.alert_type,
        "description": a.description,
        "contributing_parameters": a.contributing_parameters,
        "is_resolved": a.is_resolved,
        "resolution_notes": a.resolution_notes
    } for a in alerts]

@router.post("/resolve/{alert_id}")
def resolve_risk_alert(alert_id: str, notes: str = "Addressed via operational parameter tuning", db: Session = Depends(get_db)):
    alert = db.query(RiskAlert).filter(RiskAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_resolved = True
    alert.resolution_notes = notes
    db.commit()
    return {"status": "RESOLVED", "alert_id": alert.id}

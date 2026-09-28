from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Recommendation, OperatorAction, Well

router = APIRouter()

@router.get("/list/{well_id}")
def get_recommendations(well_id: str, db: Session = Depends(get_db)):
    recs = db.query(Recommendation).filter(Recommendation.well_id == well_id).order_by(Recommendation.created_at.desc()).all()
    results = []
    for r in recs:
        actions = db.query(OperatorAction).filter(OperatorAction.recommendation_id == r.id).order_by(OperatorAction.timestamp.desc()).all()
        results.append({
            "id": r.id,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "rec_steam_volume": r.rec_steam_volume,
            "rec_soak_days": r.rec_soak_days,
            "rec_stroke_length": r.rec_stroke_length,
            "rec_spm": r.rec_spm,
            "expected_oil_gain_bpd": r.expected_oil_gain_bpd,
            "expected_sor_reduction": r.expected_sor_reduction,
            "expected_energy_saving_pct": r.expected_energy_saving_pct,
            "safety_score": r.safety_score,
            "risk_level": r.risk_level,
            "approval_status": r.approval_status,
            "engineering_rationale": r.engineering_rationale,
            "pareto_rank": r.pareto_rank,
            "audit_trail": [{
                "operator_id": a.operator_id,
                "action": a.action,
                "notes": a.notes,
                "timestamp": a.timestamp.isoformat() if a.timestamp else None
            } for a in actions]
        })
    return results

@router.post("/action/{rec_id}")
def submit_operator_action(
    rec_id: str,
    operator_id: str = Body("Lead_Petroleum_Eng"),
    action: str = Body("APPROVED"),  # APPROVED, REJECTED, FLAGGED_FOR_INSPECTION
    notes: str = Body("Approved for next operational cycle based on Pareto frontier and safety score."),
    db: Session = Depends(get_db)
):
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.approval_status = action
    
    op_action = OperatorAction(
        recommendation_id=rec.id,
        operator_id=operator_id,
        action=action,
        notes=notes,
        timestamp=datetime.utcnow()
    )
    db.add(op_action)
    db.commit()
    db.refresh(rec)

    return {
        "status": "SUCCESS",
        "recommendation_id": rec.id,
        "new_approval_status": rec.approval_status,
        "action_recorded": {
            "operator_id": op_action.operator_id,
            "action": op_action.action,
            "notes": op_action.notes,
            "timestamp": op_action.timestamp.isoformat()
        }
    }

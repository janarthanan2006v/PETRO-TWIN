from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import DynamometerCard, Well
from app.physics.dynamometer import DynamometerCardGenerator
from app.ml.dyno_classifier import DynamometerCardClassifier

router = APIRouter()
dyno_gen = DynamometerCardGenerator()
dyno_classifier = DynamometerCardClassifier()

@router.get("/cards/{well_id}")
def get_dynamometer_cards(well_id: str, db: Session = Depends(get_db)):
    cards = db.query(DynamometerCard).filter(DynamometerCard.well_id == well_id).order_by(DynamometerCard.timestamp.desc()).all()
    return [{
        "id": c.id,
        "timestamp": c.timestamp.isoformat() if c.timestamp else None,
        "diagnostic_label": c.diagnostic_label,
        "fault_confidence": c.fault_confidence,
        "stroke_length_in": c.stroke_length_in,
        "spm": c.spm,
        "surface_position_in": c.surface_position_in,
        "surface_load_lbs": c.surface_load_lbs,
        "pump_position_in": c.pump_position_in,
        "pump_load_lbs": c.pump_load_lbs,
        "notes": c.notes
    } for c in cards]

@router.post("/synthesize-and-diagnose")
def synthesize_and_diagnose_card(
    stroke_length_in: float = Body(100.0),
    spm: float = Body(6.5),
    pprl_lbs: float = Body(21500.0),
    mprl_lbs: float = Body(6500.0),
    fluid_viscosity_cp: float = Body(95.0),
    fillage_pct: float = Body(85.0),
    fault_type: str = Body("NORMAL_OPERATION")
):
    """
    Synthesizes dynamometer card and performs automated ML classification.
    """
    card = dyno_gen.generate_card(
        stroke_length_in=stroke_length_in,
        spm=spm,
        pprl_lbs=pprl_lbs,
        mprl_lbs=mprl_lbs,
        fluid_viscosity_cp=fluid_viscosity_cp,
        fillage_pct=fillage_pct,
        fault_type=fault_type
    )
    
    classification = dyno_classifier.classify_card(card)
    
    return {
        "card_data": card,
        "ai_diagnosis": classification
    }

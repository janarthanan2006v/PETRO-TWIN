import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base

def generate_uuid():
    return str(uuid.uuid4())

class Well(Base):
    __tablename__ = "wells"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False, unique=True)
    field_location = Column(String(100), default="Baghewala Field, Rajasthan")
    status = Column(String(50), default="PRODUCING")  # INJECTING, SOAKING, PRODUCING, SHUT_IN
    api_gravity = Column(Float, default=14.5)
    reservoir_depth_m = Column(Float, default=1100.0)
    initial_res_temp_c = Column(Float, default=55.0)
    current_res_temp_c = Column(Float, default=145.0)
    oil_viscosity_cp = Column(Float, default=125.0)
    plunger_diameter_in = Column(Float, default=2.25)
    rod_rating_lbs = Column(Float, default=28000.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    css_cycles = relationship("CSSCycle", back_populates="well", cascade="all, delete-orphan")
    production_records = relationship("ProductionRecord", back_populates="well", cascade="all, delete-orphan")
    srp_records = relationship("SRPRecord", back_populates="well", cascade="all, delete-orphan")
    dynamometer_cards = relationship("DynamometerCard", back_populates="well", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="well", cascade="all, delete-orphan")
    risk_alerts = relationship("RiskAlert", back_populates="well", cascade="all, delete-orphan")

class CSSCycle(Base):
    __tablename__ = "css_cycles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    well_id = Column(String(36), ForeignKey("wells.id"), nullable=False)
    cycle_number = Column(Integer, nullable=False)
    injection_start = Column(DateTime, default=datetime.utcnow)
    injection_days = Column(Float, default=14.0)
    soak_days = Column(Float, default=7.0)
    steam_volume_tonnes = Column(Float, default=2200.0)
    steam_pressure_bar = Column(Float, default=65.0)
    steam_temp_c = Column(Float, default=280.0)
    steam_quality = Column(Float, default=0.75)
    peak_bottomhole_temp_c = Column(Float, default=210.0)
    status = Column(String(50), default="COMPLETED")  # ACTIVE, COMPLETED

    well = relationship("Well", back_populates="css_cycles")

class ProductionRecord(Base):
    __tablename__ = "production_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    well_id = Column(String(36), ForeignKey("wells.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    cycle_day = Column(Float, default=1.0)
    oil_rate_bpd = Column(Float, default=180.0)
    water_rate_bpd = Column(Float, default=45.0)
    fluid_rate_bpd = Column(Float, default=225.0)
    wellhead_temp_c = Column(Float, default=85.0)
    bottomhole_temp_c = Column(Float, default=155.0)
    bottomhole_pressure_bar = Column(Float, default=42.0)
    oil_viscosity_cp = Column(Float, default=85.0)
    steam_to_oil_ratio = Column(Float, default=2.8)

    well = relationship("Well", back_populates="production_records")

class SRPRecord(Base):
    __tablename__ = "srp_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    well_id = Column(String(36), ForeignKey("wells.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    spm = Column(Float, default=6.5)
    stroke_length_in = Column(Float, default=100.0)
    pprl_lbs = Column(Float, default=21400.0)  # Peak Polished Rod Load
    mprl_lbs = Column(Float, default=6800.0)   # Minimum Polished Rod Load
    motor_power_kw = Column(Float, default=24.5)
    energy_kwh_per_bbl = Column(Float, default=3.26)
    pump_fillage_pct = Column(Float, default=88.5)
    rod_load_pct = Column(Float, default=76.4)
    vfd_frequency_hz = Column(Float, default=48.0)

    well = relationship("Well", back_populates="srp_records")

class DynamometerCard(Base):
    __tablename__ = "dynamometer_cards"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    well_id = Column(String(36), ForeignKey("wells.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    card_type = Column(String(50), default="SURFACE_AND_DOWNHOLE")
    stroke_length_in = Column(Float, default=100.0)
    spm = Column(Float, default=6.5)
    
    # Coordinates array stored as JSON lists of numbers
    surface_position_in = Column(JSON, nullable=False)
    surface_load_lbs = Column(JSON, nullable=False)
    pump_position_in = Column(JSON, nullable=False)
    pump_load_lbs = Column(JSON, nullable=False)
    
    diagnostic_label = Column(String(100), default="NORMAL_OPERATION")
    # Labels: NORMAL_OPERATION, FLUID_POUND, GAS_INTERFERENCE, WORN_TRAVELING_VALVE, 
    # ROD_FLOATING, MECHANICAL_OVERLOAD
    fault_confidence = Column(Float, default=0.96)
    notes = Column(Text, nullable=True)

    well = relationship("Well", back_populates="dynamometer_cards")

class SimulationScenario(Base):
    __tablename__ = "simulation_scenarios"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    well_id = Column(String(36), ForeignKey("wells.id"), nullable=False)
    name = Column(String(150), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Input parameters JSON
    input_params = Column(JSON, nullable=False)
    # Output simulated trajectory JSON (temperature curve, viscosity curve, production rate, loads, SOR, energy)
    simulation_results = Column(JSON, nullable=False)
    summary_metrics = Column(JSON, nullable=False)

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    well_id = Column(String(36), ForeignKey("wells.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    rec_steam_volume = Column(Float, nullable=False)
    rec_soak_days = Column(Float, nullable=False)
    rec_stroke_length = Column(Float, nullable=False)
    rec_spm = Column(Float, nullable=False)
    
    expected_oil_gain_bpd = Column(Float, nullable=False)
    expected_sor_reduction = Column(Float, nullable=False)
    expected_energy_saving_pct = Column(Float, nullable=False)
    safety_score = Column(Float, default=94.5)  # 0 to 100
    risk_level = Column(String(20), default="LOW")  # LOW, MEDIUM, HIGH
    
    approval_status = Column(String(50), default="PENDING_REVIEW")
    # PENDING_REVIEW, APPROVED, REJECTED, REQUIRES_FIELD_VALIDATION
    engineering_rationale = Column(Text, nullable=False)
    pareto_rank = Column(Integer, default=1)

    well = relationship("Well", back_populates="recommendations")
    actions = relationship("OperatorAction", back_populates="recommendation", cascade="all, delete-orphan")

class OperatorAction(Base):
    __tablename__ = "operator_actions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    recommendation_id = Column(String(36), ForeignKey("recommendations.id"), nullable=False)
    operator_id = Column(String(100), default="Lead_Production_Eng_01")
    action = Column(String(50), nullable=False)  # APPROVED, REJECTED, FLAGGED_FOR_INSPECTION
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    recommendation = relationship("Recommendation", back_populates="actions")

class RiskAlert(Base):
    __tablename__ = "risk_alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    well_id = Column(String(36), ForeignKey("wells.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    severity = Column(String(20), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    alert_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    contributing_parameters = Column(JSON, nullable=True)
    is_resolved = Column(Boolean, default=False)
    resolution_notes = Column(Text, nullable=True)

    well = relationship("Well", back_populates="risk_alerts")

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    model_name = Column(String(100), nullable=False)
    version = Column(String(50), nullable=False)
    trained_at = Column(DateTime, default=datetime.utcnow)
    mae = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    r2 = Column(Float, nullable=False)
    status = Column(String(50), default="ACTIVE")
    hyperparameters = Column(JSON, nullable=True)

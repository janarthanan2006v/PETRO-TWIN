import asyncio
import json
import random
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.api.api_router import api_router
from app.db.models import Well
from seed_data import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB Schema and Seed initial heavy oil well dataset
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not db.query(Well).first():
            print("No wells found in database. Running seed script...")
            seed_database()
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Physics-informed AI Digital Twin for Cyclic Steam Stimulation (CSS) and Sucker Rod Pump (SRP) coupled optimization in heavy-oil wells.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "project": "PETRO-TWIN",
        "description": "AI-Enabled Well-to-Surface Digital Twin for CSS + SRP Optimization in Heavy-Oil Wells",
        "status": "ONLINE",
        "docs_url": "/docs",
        "version": "1.0.0",
        "author": "PETRO-TWIN SIH Development Team"
    }

# WebSocket for Live Real-Time Digital Twin Telemetry Stream
@app.websocket("/ws/digital-twin/{well_id}")
async def websocket_digital_twin_stream(websocket: WebSocket, well_id: str):
    await websocket.accept()
    print(f"WebSocket client connected for well {well_id}")
    
    # Baseline telemetry state
    base_temp = 145.0
    base_visc = 95.0
    base_oil = 180.0
    base_pprl = 21500.0
    base_mprl = 6800.0
    spm = 6.5
    stroke_length = 100.0
    
    try:
        while True:
            # Simulate real-time digital twin continuous sensory pulse
            noise_temp = random.uniform(-0.3, 0.3)
            noise_rate = random.uniform(-1.5, 1.5)
            noise_pprl = random.uniform(-100.0, 100.0)
            
            # Slow thermal decay
            base_temp = max(58.0, base_temp - 0.02)
            # Walther viscosity reaction
            val = 9.85 - 3.65 * (base_temp + 273.15)
            base_visc = max(15.0, min(12000.0, float(10 ** (10 ** (9.85 - 3.65 * 2.62)) - 0.7)))
            
            telemetry_payload = {
                "timestamp": asyncio.get_event_loop().time(),
                "well_id": well_id,
                "reservoir": {
                    "temperature_c": round(base_temp + noise_temp, 2),
                    "viscosity_cp": round(95.0 + (145.0 - base_temp) * 4.2, 1),
                    "pressure_bar": round(43.5 + random.uniform(-0.1, 0.1), 2)
                },
                "wellbore": {
                    "wellhead_temp_c": round(base_temp * 0.58 + noise_temp * 0.5, 2),
                    "pressure_loss_bar": 3.82
                },
                "srp": {
                    "spm": spm,
                    "stroke_length_in": stroke_length,
                    "pprl_lbs": round(base_pprl + noise_pprl, 1),
                    "mprl_lbs": round(base_mprl + noise_pprl * 0.4, 1),
                    "pump_fillage_pct": round(88.0 + random.uniform(-1.0, 1.0), 1),
                    "motor_power_kw": round(24.5 + random.uniform(-0.3, 0.3), 2),
                    "is_rod_floating": (base_mprl + noise_pprl * 0.4) < 2000.0
                },
                "surface": {
                    "oil_rate_bpd": round(base_oil + noise_rate, 2),
                    "water_rate_bpd": round(42.0 + noise_rate * 0.2, 2),
                    "energy_kwh_per_bbl": 3.25,
                    "sor": 2.68
                }
            }
            
            await websocket.send_text(json.dumps(telemetry_payload))
            await asyncio.sleep(2.0)
            
    except WebSocketDisconnect:
        print(f"WebSocket client disconnected for well {well_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")

import random
import numpy as np
import pandas as pd
from app.physics.coupled_twin import CoupledWellToSurfaceDigitalTwin

class HeavyOilDatasetGenerator:
    """
    Synthetic dataset generator for Heavy-Oil CSS + SRP wells.
    Generates realistic multi-cycle production, thermal, and dynamometer telemetry.
    Clearly designated as synthetic data calibrated to Baghewala reservoir properties.
    """

    def __init__(self, random_seed: int = 42):
        np.random.seed(random_seed)
        random.seed(random_seed)

    def generate_well_dataset(
        self,
        well_name: str = "BW-01",
        num_cycles: int = 4,
        days_per_cycle: int = 75
    ) -> pd.DataFrame:
        """
        Generates continuous time-series dataset over multiple CSS cycles.
        """
        twin = CoupledWellToSurfaceDigitalTwin()
        records = []
        global_day = 1
        
        for cycle in range(1, num_cycles + 1):
            # Vary operational parameters per cycle
            steam_vol = float(np.random.uniform(1800.0, 2600.0))
            steam_press = float(np.random.uniform(60.0, 72.0))
            soak_days = float(np.random.choice([5.0, 7.0, 10.0]))
            stroke_length = float(np.random.choice([86.0, 100.0, 120.0]))
            spm = float(np.random.uniform(4.5, 8.5))
            
            sim = twin.simulate_css_production_cycle(
                steam_volume_tonnes=steam_vol,
                steam_pressure_bar=steam_press,
                soak_days=soak_days,
                stroke_length_in=stroke_length,
                spm=spm,
                cycle_duration_days=days_per_cycle
            )
            
            for d in sim["daily_trajectory"]:
                # Add realistic sensor noise (±2%)
                noise_temp = np.random.normal(0, 0.5)
                noise_rate = np.random.normal(0, 1.2)
                noise_load = np.random.normal(0, 150.0)
                
                records.append({
                    "well_name": well_name,
                    "global_day": global_day,
                    "cycle_number": cycle,
                    "cycle_day": d["day"],
                    "steam_volume_tonnes": round(steam_vol, 1),
                    "steam_pressure_bar": round(steam_press, 1),
                    "soak_days": soak_days,
                    "stroke_length_in": stroke_length,
                    "spm": round(spm, 2),
                    "reservoir_temp_c": round(d["reservoir_temp_c"] + noise_temp, 2),
                    "wellhead_temp_c": round(d["wellhead_temp_c"] + noise_temp * 0.8, 2),
                    "oil_viscosity_cp": d["viscosity_cp"],
                    "oil_rate_bpd": max(5.0, round(d["oil_rate_bpd"] + noise_rate, 2)),
                    "water_rate_bpd": max(2.0, round(d["water_rate_bpd"] + noise_rate * 0.3, 2)),
                    "cumulative_oil_bbl": d["cumulative_oil_bbl"],
                    "fillage_pct": round(d["fillage_pct"], 1),
                    "pprl_lbs": round(d["pprl_lbs"] + noise_load, 1),
                    "mprl_lbs": round(d["mprl_lbs"] + noise_load * 0.5, 1),
                    "rod_load_pct": d["rod_load_pct"],
                    "motor_power_kw": d["motor_power_kw"],
                    "energy_kwh_per_bbl": d["energy_kwh_per_bbl"],
                    "steam_to_oil_ratio": d["sor"],
                    "risk_score": d["risk_score"],
                    "is_synthetic": True
                })
                global_day += 1

        return pd.DataFrame(records)

from app.physics.reservoir_thermal import HeavyOilReservoirThermalModel
from app.physics.wellbore_flow import WellboreFlowModel
from app.physics.srp_mechanics import SuckerRodPumpMechanicsModel
from app.physics.dynamometer import DynamometerCardGenerator

class CoupledWellToSurfaceDigitalTwin:
    """
    Coupled Reservoir-Wellbore-SRP-Surface Digital Twin Simulation Engine.
    Models the interdependent physics between thermal CSS recovery and SRP mechanical operation.
    """

    def __init__(
        self,
        api_gravity: float = 14.5,
        initial_res_temp_c: float = 55.0,
        reservoir_depth_m: float = 1100.0,
        plunger_diameter_in: float = 2.25,
        rod_rating_lbs: float = 28000.0
    ):
        self.reservoir_model = HeavyOilReservoirThermalModel(
            api_gravity=api_gravity,
            initial_res_temp_c=initial_res_temp_c
        )
        self.wellbore_model = WellboreFlowModel(depth_m=reservoir_depth_m)
        self.srp_model = SuckerRodPumpMechanicsModel(
            plunger_diameter_in=plunger_diameter_in,
            pump_depth_m=reservoir_depth_m,
            rod_rating_lbs=rod_rating_lbs
        )
        self.dyno_generator = DynamometerCardGenerator()

    def simulate_css_production_cycle(
        self,
        steam_volume_tonnes: float = 2200.0,
        steam_pressure_bar: float = 65.0,
        soak_days: float = 7.0,
        stroke_length_in: float = 100.0,
        spm: float = 6.5,
        cycle_duration_days: int = 90
    ) -> dict:
        """
        Executes a coupled multi-day simulation of the heavy-oil CSS + SRP production cycle.
        """
        # 1. Thermal Recovery Peak Calculation
        peak_temp_c = self.reservoir_model.calculate_peak_heated_temperature(
            steam_volume_tonnes=steam_volume_tonnes,
            steam_quality=0.75,
            soak_days=soak_days
        )
        
        # 2. Daily Thermal Decline Trajectory
        res_temps = self.reservoir_model.calculate_temperature_trajectory(
            peak_temp_c=peak_temp_c,
            total_cycle_days=cycle_duration_days,
            tau_decay_days=45.0 + (steam_volume_tonnes / 100.0)
        )
        
        # Simulation arrays
        daily_records = []
        cumulative_oil_bbl = 0.0
        cumulative_water_bbl = 0.0
        cumulative_energy_kwh = 0.0
        
        # Calculate maximum pump displacement capacity
        q_disp = self.srp_model.calculate_theoretical_displacement(stroke_length_in, spm)
        
        for day_idx, t_res in enumerate(res_temps):
            day_num = day_idx + 1
            
            # Fluid Viscosity
            viscosity_cp = self.reservoir_model.calculate_viscosity_cp(t_res)
            
            # Reservoir Inflow Potential
            inflow_potential_bpd = self.reservoir_model.calculate_inflow_potential(
                viscosity_cp=viscosity_cp,
                reservoir_pressure_bar=52.0 - (day_num * 0.12),
                flowing_bottomhole_pressure_bar=22.0
            )
            
            # Actual Produced Oil is bounded by Pump Displacement & Inflow
            actual_oil_rate_bpd = min(q_disp * 0.85, inflow_potential_bpd)
            # Water production with steam condensate breakthrough decay
            condensate_fraction = max(0.15, 0.45 * (1.0 - day_num / cycle_duration_days))
            actual_water_rate_bpd = actual_oil_rate_bpd * condensate_fraction
            total_liquid_bpd = actual_oil_rate_bpd + actual_water_rate_bpd
            
            # Wellbore Temperature & Hydraulics
            t_wellhead = self.wellbore_model.calculate_wellhead_temperature(
                bottomhole_temp_c=t_res,
                total_liquid_rate_bpd=total_liquid_bpd
            )
            hydraulics = self.wellbore_model.calculate_wellbore_pressure_drop(
                bottomhole_temp_c=t_res,
                oil_rate_bpd=actual_oil_rate_bpd,
                water_rate_bpd=actual_water_rate_bpd,
                average_viscosity_cp=viscosity_cp * 0.8
            )
            
            # SRP Mechanical Loads
            rod_loads = self.srp_model.calculate_rod_loads(
                stroke_length_in=stroke_length_in,
                spm=spm,
                fluid_viscosity_cp=viscosity_cp
            )
            
            # Pump Fillage
            fillage_pct = self.srp_model.calculate_pump_fillage(
                reservoir_inflow_bpd=total_liquid_bpd,
                stroke_length_in=stroke_length_in,
                spm=spm
            )
            
            # Power & Energy
            power_energy = self.srp_model.calculate_power_and_energy(
                stroke_length_in=stroke_length_in,
                spm=spm,
                pprl_lbs=rod_loads["pprl_lbs"],
                mprl_lbs=rod_loads["mprl_lbs"],
                actual_production_bpd=actual_oil_rate_bpd
            )
            
            # Daily Cumulative tracking
            cumulative_oil_bbl += actual_oil_rate_bpd
            cumulative_water_bbl += actual_water_rate_bpd
            cumulative_energy_kwh += power_energy["daily_kwh"]
            
            # Steam to Oil Ratio (SOR) - cold water equivalent
            steam_tonnes_cwe_bbl = steam_volume_tonnes * 6.2898
            daily_sor = steam_tonnes_cwe_bbl / max(1.0, cumulative_oil_bbl)
            
            # Failure risk index composite score (0 to 100)
            # Factors: Rod Overload, Rod Floating, Fluid Pound
            risk_score = 0.0
            if rod_loads["rod_load_pct"] > 85.0:
                risk_score += (rod_loads["rod_load_pct"] - 85.0) * 3.0
            if rod_loads["is_rod_floating"]:
                risk_score += 45.0
            if fillage_pct < 65.0:
                risk_score += (65.0 - fillage_pct) * 0.8
            risk_score = min(100.0, max(5.0, risk_score))
            
            daily_records.append({
                "day": day_num,
                "reservoir_temp_c": t_res,
                "wellhead_temp_c": t_wellhead,
                "viscosity_cp": viscosity_cp,
                "oil_rate_bpd": round(actual_oil_rate_bpd, 2),
                "water_rate_bpd": round(actual_water_rate_bpd, 2),
                "cumulative_oil_bbl": round(cumulative_oil_bbl, 1),
                "fillage_pct": fillage_pct,
                "pprl_lbs": rod_loads["pprl_lbs"],
                "mprl_lbs": rod_loads["mprl_lbs"],
                "rod_load_pct": rod_loads["rod_load_pct"],
                "is_rod_floating": rod_loads["is_rod_floating"],
                "motor_power_kw": power_energy["motor_power_kw"],
                "energy_kwh_per_bbl": power_energy["energy_kwh_per_bbl"],
                "sor": round(daily_sor, 2),
                "risk_score": round(risk_score, 1)
            })

        # Summary Metrics
        avg_oil_bpd = cumulative_oil_bbl / cycle_duration_days
        final_sor = (steam_volume_tonnes * 6.2898) / max(1.0, cumulative_oil_bbl)
        avg_kwh_per_bbl = cumulative_energy_kwh / max(1.0, cumulative_oil_bbl)
        avg_risk = sum(r["risk_score"] for r in daily_records) / len(daily_records)
        
        # Representative Dynamometer Card at Day 30
        day30_rec = daily_records[min(29, len(daily_records)-1)]
        dyno_fault = "NORMAL_OPERATION"
        if day30_rec["is_rod_floating"]:
            dyno_fault = "ROD_FLOATING"
        elif day30_rec["fillage_pct"] < 65.0:
            dyno_fault = "FLUID_POUND"
        elif day30_rec["rod_load_pct"] > 90.0:
            dyno_fault = "MECHANICAL_OVERLOAD"
            
        dyno_card = self.dyno_generator.generate_card(
            stroke_length_in=stroke_length_in,
            spm=spm,
            pprl_lbs=day30_rec["pprl_lbs"],
            mprl_lbs=day30_rec["mprl_lbs"],
            fluid_viscosity_cp=day30_rec["viscosity_cp"],
            fillage_pct=day30_rec["fillage_pct"],
            fault_type=dyno_fault
        )

        return {
            "summary": {
                "peak_temp_c": round(peak_temp_c, 1),
                "cumulative_oil_bbl": round(cumulative_oil_bbl, 1),
                "average_oil_rate_bpd": round(avg_oil_bpd, 2),
                "steam_to_oil_ratio": round(final_sor, 2),
                "average_energy_kwh_per_bbl": round(avg_kwh_per_bbl, 2),
                "average_risk_score": round(avg_risk, 1),
                "max_rod_load_pct": max(r["rod_load_pct"] for r in daily_records),
                "is_rod_floating_detected": any(r["is_rod_floating"] for r in daily_records)
            },
            "daily_trajectory": daily_records,
            "representative_dynamometer_card": dyno_card
        }

import math

class SuckerRodPumpMechanicsModel:
    """
    Sucker Rod Pump (SRP) mechanics and artificial lift loading model.
    Accounts for heavy-oil viscous friction, rod acceleration, fluid load,
    rod floating risk, and electric power consumption.
    """

    def __init__(
        self,
        plunger_diameter_in: float = 2.25,
        pump_depth_m: float = 1100.0,
        rod_diameter_in: float = 1.0,  # e.g. Grade D / API sucker rod
        rod_density_lbs_ft: float = 2.90,  # 1-inch rod ~ 2.90 lbs/ft
        rod_rating_lbs: float = 28000.0,
        motor_efficiency: float = 0.85,
        surface_unit_efficiency: float = 0.78
    ):
        self.plunger_dia = plunger_diameter_in
        self.depth_m = pump_depth_m
        self.depth_ft = pump_depth_m * 3.28084
        self.rod_dia = rod_diameter_in
        self.rod_density = rod_density_lbs_ft
        self.rod_rating = rod_rating_lbs
        self.motor_eff = motor_efficiency
        self.unit_eff = surface_unit_efficiency

    def calculate_theoretical_displacement(self, stroke_length_in: float, spm: float) -> float:
        """
        Theoretical pump displacement Q_disp (bbl/day).
        Q_disp = 0.1484 * (d_plunger)^2 * Stroke_in * SPM
        """
        q_disp = 0.1484 * (self.plunger_dia ** 2) * stroke_length_in * spm
        return float(round(q_disp, 2))

    def calculate_pump_fillage(self, reservoir_inflow_bpd: float, stroke_length_in: float, spm: float) -> float:
        """
        Calculates pump volumetric fillage percentage.
        Below 70% indicates severe fluid pound risk.
        """
        q_disp = self.calculate_theoretical_displacement(stroke_length_in, spm)
        if q_disp <= 0:
            return 0.0
        fillage = (reservoir_inflow_bpd / q_disp) * 100.0
        return float(round(min(100.0, max(15.0, fillage)), 1))

    def calculate_rod_loads(
        self,
        stroke_length_in: float,
        spm: float,
        fluid_viscosity_cp: float,
        fluid_specific_gravity: float = 0.95
    ) -> dict:
        """
        Calculates PPRL, MPRL, rod stress, viscous drag, and rod floating risk.
        """
        # Rod string weight in air (lbs)
        w_rod_air = self.rod_density * self.depth_ft
        
        # Buoyant rod weight
        buoyancy_factor = 1.0 - (fluid_specific_gravity * 62.4) / 490.0  # steel density ~ 490 lbs/cu ft
        w_rod_buoyant = w_rod_air * buoyancy_factor
        
        # Fluid load on plunger (lbs)
        # Area = pi/4 * d^2
        plunger_area_sqin = (math.pi / 4.0) * (self.plunger_dia ** 2)
        rod_area_sqin = (math.pi / 4.0) * (self.rod_dia ** 2)
        net_plunger_area = max(0.2, plunger_area_sqin - rod_area_sqin)
        
        fluid_gradient_psi_ft = 0.433 * fluid_specific_gravity
        fluid_head_psi = fluid_gradient_psi_ft * self.depth_ft
        w_fluid_lbs = fluid_head_psi * net_plunger_area
        
        # Mills acceleration factor (API RP 11L)
        accel_factor = (stroke_length_in * (spm ** 2)) / 70500.0
        
        # Heavy-oil viscous drag force on rod string (lbs)
        # Viscous shear stress: tau = mu * (v_rod / clearance)
        # Upstroke velocity:
        v_rod_ft_s = (2.0 * stroke_length_in * spm) / (12.0 * 60.0)
        
        # Empirical heavy oil viscous drag (lbs)
        viscous_drag_lbs = 0.085 * (fluid_viscosity_cp ** 0.60) * (v_rod_ft_s ** 0.8) * (self.depth_ft / 1000.0)
        
        # Peak Polished Rod Load (PPRL) on Upstroke (lbs)
        pprl = w_fluid_lbs + w_rod_air * (1.0 + accel_factor) + viscous_drag_lbs
        
        # Minimum Polished Rod Load (MPRL) on Downstroke (lbs)
        # On downstroke, viscous drag opposes downward gravity motion!
        mprl = w_rod_buoyant * (1.0 - accel_factor) - viscous_drag_lbs
        
        # Rod floating indicator
        # When viscous drag + upward acceleration exceeds buoyant rod weight, rods float
        is_rod_floating = mprl < (0.10 * w_rod_air)
        rod_floating_margin_lbs = mprl
        
        # Rod loading percentage of rated yield
        rod_load_pct = (pprl / max(1.0, self.rod_rating)) * 100.0
        
        return {
            "w_rod_air_lbs": round(w_rod_air, 1),
            "w_rod_buoyant_lbs": round(w_rod_buoyant, 1),
            "w_fluid_lbs": round(w_fluid_lbs, 1),
            "accel_factor": round(accel_factor, 3),
            "viscous_drag_lbs": round(viscous_drag_lbs, 1),
            "pprl_lbs": round(pprl, 1),
            "mprl_lbs": round(mprl, 1),
            "rod_load_pct": round(rod_load_pct, 1),
            "is_rod_floating": bool(is_rod_floating),
            "is_overloaded": bool(rod_load_pct > 90.0)
        }

    def calculate_power_and_energy(
        self,
        stroke_length_in: float,
        spm: float,
        pprl_lbs: float,
        mprl_lbs: float,
        actual_production_bpd: float
    ) -> dict:
        """
        Calculates hydraulic power, polished rod power (PRHP), motor input kW,
        and specific energy consumption (kWh/bbl).
        """
        # Polished Rod Horsepower (PRHP)
        stroke_ft = stroke_length_in / 12.0
        delta_load_lbs = max(500.0, pprl_lbs - mprl_lbs)
        
        # Cyclic work approximation
        prhp = (delta_load_lbs * stroke_ft * spm) / 33000.0
        
        # Electric motor power input (kW)
        overall_eff = max(0.4, self.motor_eff * self.unit_eff)
        motor_kw = (prhp * 0.7457) / overall_eff
        
        # Specific energy consumption per barrel of oil (kWh/bbl)
        daily_energy_kwh = motor_kw * 24.0
        kwh_per_bbl = daily_energy_kwh / max(1.0, actual_production_bpd)
        
        return {
            "polished_rod_hp": round(prhp, 2),
            "motor_power_kw": round(motor_kw, 2),
            "daily_kwh": round(daily_energy_kwh, 2),
            "energy_kwh_per_bbl": round(min(50.0, kwh_per_bbl), 2)
        }

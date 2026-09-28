import math

class WellboreFlowModel:
    """
    Wellbore hydraulics and thermal transfer model for heavy oil production.
    Simulates bottomhole-to-wellhead temperature gradient and flowing pressure drop.
    """

    def __init__(
        self,
        depth_m: float = 1100.0,
        tubing_inner_dia_in: float = 2.875,
        casing_dia_in: float = 7.0,
        geothermal_gradient_c_per_100m: float = 2.8,
        ambient_surface_temp_c: float = 30.0
    ):
        self.depth_m = depth_m
        self.tubing_id_in = tubing_inner_dia_in
        self.casing_dia_in = casing_dia_in
        self.geothermal_grad = geothermal_gradient_c_per_100m
        self.surface_temp_c = ambient_surface_temp_c

    def calculate_wellhead_temperature(
        self,
        bottomhole_temp_c: float,
        total_liquid_rate_bpd: float,
        oil_fraction: float = 0.80
    ) -> float:
        """
        Ramey-style wellbore heat loss approximation.
        Higher flow rates retain heat up to the surface.
        """
        # Relaxation distance parameter (meters) proportional to liquid mass rate
        mass_flow_kg_s = max(0.1, total_liquid_rate_bpd * 0.00184)
        relaxation_length_a = 450.0 * (mass_flow_kg_s ** 0.85)
        
        # Heat transfer exponent
        exp_term = math.exp(-self.depth_m / max(50.0, relaxation_length_a))
        
        # Approximate surface wellhead temperature
        t_surface = (bottomhole_temp_c - self.surface_temp_c) * exp_term + self.surface_temp_c
        t_surface = max(self.surface_temp_c + 5.0, min(bottomhole_temp_c - 5.0, t_surface))
        return float(round(t_surface, 2))

    def calculate_wellbore_pressure_drop(
        self,
        bottomhole_temp_c: float,
        oil_rate_bpd: float,
        water_rate_bpd: float,
        average_viscosity_cp: float
    ) -> dict:
        """
        Calculates hydrostatic head and frictional pressure loss in tubing.
        """
        total_liquid_bpd = oil_rate_bpd + water_rate_bpd
        water_cut = water_rate_bpd / max(1.0, total_liquid_bpd)
        
        # Mixture density (kg/m3)
        rho_oil = 950.0
        rho_water = 1020.0
        rho_mix = (1.0 - water_cut) * rho_oil + water_cut * rho_water
        
        # Hydrostatic pressure drop (bar)
        p_hydrostatic_bar = (rho_mix * 9.81 * self.depth_m) / 100000.0
        
        # Tubing cross-sectional area (m2)
        d_tubing_m = self.tubing_id_in * 0.0254
        area_m2 = math.pi * (d_tubing_m / 2.0) ** 2
        
        # Fluid velocity (m/s)
        q_m3_s = (total_liquid_bpd * 0.158987) / 86400.0
        v_fluid_m_s = q_m3_s / area_m2
        
        # Reynolds number
        mu_pa_s = average_viscosity_cp * 0.001
        reynolds = (rho_mix * v_fluid_m_s * d_tubing_m) / max(1e-5, mu_pa_s)
        
        # Fanning friction factor
        if reynolds < 2000:
            friction_factor = 16.0 / max(1.0, reynolds)
        else:
            friction_factor = 0.079 / (reynolds ** 0.25)
            
        friction_factor = min(0.15, friction_factor)
        
        # Frictional pressure drop (bar)
        p_friction_bar = (2.0 * friction_factor * rho_mix * (v_fluid_m_s ** 2) * self.depth_m) / (d_tubing_m * 100000.0)
        
        return {
            "hydrostatic_pressure_bar": round(p_hydrostatic_bar, 2),
            "friction_pressure_bar": round(p_friction_bar, 2),
            "total_pressure_drop_bar": round(p_hydrostatic_bar + p_friction_bar, 2),
            "reynolds_number": round(reynolds, 2),
            "flow_velocity_m_s": round(v_fluid_m_s, 3)
        }

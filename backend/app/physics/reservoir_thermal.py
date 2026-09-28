import math
import numpy as np

class HeavyOilReservoirThermalModel:
    """
    Physics-informed thermal recovery model for Cyclic Steam Stimulation (CSS)
    based on Boberg-Lantz heat balance and ASTM D341 / Andrade heavy-oil viscosity equations.
    Calibrated for heavy oil reservoirs (e.g., Baghewala Field: 12-18 API, 50-60°C initial temp).
    """

    def __init__(
        self,
        api_gravity: float = 14.5,
        initial_res_temp_c: float = 55.0,
        steam_temp_c: float = 280.0,
        steam_enthalpy_kj_kg: float = 2770.0,
        rock_volumetric_heat_cap_kj_m3c: float = 2350.0,
        reservoir_thickness_m: float = 18.0,
        drainage_radius_m: float = 75.0,
        overburden_thermal_diffusivity_m2_day: float = 0.08
    ):
        self.api_gravity = api_gravity
        self.initial_res_temp_c = initial_res_temp_c
        self.steam_temp_c = steam_temp_c
        self.steam_enthalpy_kj_kg = steam_enthalpy_kj_kg
        self.rock_heat_cap = rock_volumetric_heat_cap_kj_m3c
        self.thickness = reservoir_thickness_m
        self.radius = drainage_radius_m
        self.thermal_diffusivity = overburden_thermal_diffusivity_m2_day
        
        # ASTM D341 Walther Viscosity coefficients for heavy oil (14.5 API)
        # log10(log10(v + 0.7)) = A - B * log10(T_Kelvin)
        self.walther_a = 9.85
        self.walther_b = 3.65

    def calculate_peak_heated_temperature(
        self,
        steam_volume_tonnes: float,
        steam_quality: float = 0.75,
        soak_days: float = 7.0
    ) -> float:
        """
        Calculates peak reservoir temperature after steam injection and soak period.
        """
        # Effective thermal energy injected (MJ)
        mass_steam_kg = steam_volume_tonnes * 1000.0
        sensible_heat_kj = mass_steam_kg * 4.184 * (self.steam_temp_c - self.initial_res_temp_c)
        latent_heat_kj = mass_steam_kg * steam_quality * 1700.0  # approximate latent heat of steam
        total_heat_injected_mj = (sensible_heat_kj + latent_heat_kj) / 1000.0
        
        # Heated zone volume approximation (m^3)
        # Boberg-Lantz unit thermal volume
        heated_radius_m = min(self.radius * 0.65, math.sqrt((mass_steam_kg * 0.0018) / (math.pi * self.thickness * 0.30)))
        heated_volume_m3 = math.pi * (heated_radius_m ** 2) * self.thickness
        reservoir_heat_capacity_mj_c = (heated_volume_m3 * self.rock_heat_cap) / 1000.0
        
        # Temperature rise with thermal efficiency
        thermal_efficiency = 0.82 * math.exp(-0.015 * soak_days)
        delta_temp = (total_heat_injected_mj * thermal_efficiency) / max(1.0, reservoir_heat_capacity_mj_c)
        
        peak_temp = self.initial_res_temp_c + min(self.steam_temp_c - self.initial_res_temp_c, delta_temp)
        return float(min(self.steam_temp_c - 15.0, peak_temp))

    def calculate_temperature_trajectory(
        self,
        peak_temp_c: float,
        total_cycle_days: int = 90,
        tau_decay_days: float = 48.0
    ) -> list[float]:
        """
        Calculates daily reservoir cooling profile over the production cycle.
        """
        days = np.arange(0, total_cycle_days)
        # Boberg-Lantz cooling decay
        decay_factor = np.exp(-days / max(10.0, tau_decay_days))
        temp_curve = self.initial_res_temp_c + (peak_temp_c - self.initial_res_temp_c) * decay_factor
        return [float(round(t, 2)) for t in temp_curve]

    def calculate_viscosity_cp(self, temp_c: float) -> float:
        """
        Calculates heavy oil dynamic viscosity (cP) at a given temperature (°C)
        using ASTM D341 / Walther empirical formula.
        At 55°C (cold): ~1,500 - 3,500 cP
        At 180°C (hot): ~12 - 35 cP
        """
        t_kelvin = temp_c + 273.15
        val = self.walther_a - self.walther_b * math.log10(t_kelvin)
        kinematic_viscosity_cst = 10 ** (10 ** val) - 0.7
        kinematic_viscosity_cst = max(2.0, min(50000.0, kinematic_viscosity_cst))
        
        # Specific gravity from API
        sg = 141.5 / (self.api_gravity + 131.5)
        dynamic_viscosity_cp = kinematic_viscosity_cst * sg
        return float(round(dynamic_viscosity_cp, 2))

    def calculate_inflow_potential(
        self,
        viscosity_cp: float,
        reservoir_pressure_bar: float = 55.0,
        flowing_bottomhole_pressure_bar: float = 25.0,
        cold_pi_bpd_bar: float = 1.2
    ) -> float:
        """
        Calculates reservoir inflow rate (bpd) with viscosity correction.
        """
        ref_cold_viscosity_cp = self.calculate_viscosity_cp(self.initial_res_temp_c)
        # Thermal mobility enhancement factor
        mobility_ratio = (ref_cold_viscosity_cp / max(2.0, viscosity_cp)) ** 0.72
        drawdown = max(0.0, reservoir_pressure_bar - flowing_bottomhole_pressure_bar)
        
        # Inflow rate
        oil_rate_bpd = cold_pi_bpd_bar * drawdown * mobility_ratio
        return float(round(oil_rate_bpd, 2))

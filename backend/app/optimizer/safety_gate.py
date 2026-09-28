class SafetyGateEngine:
    """
    Hard Engineering Safety Validation Layer.
    Audits proposed CSS injection and SRP pumping configurations against
    strict petroleum engineering and mechanical limits before human review.
    """

    MAX_ROD_LOAD_RATIO = 0.90       # Maximum 90% of rod yield strength
    MIN_MPRL_LBS = 1500.0           # Minimum compressive threshold to prevent rod floating
    MIN_PUMP_FILLAGE_PCT = 60.0     # Minimum pump volumetric fillage to prevent fluid pound
    MAX_STEAM_PRESSURE_BAR = 80.0   # Maximum wellhead steam injection pressure
    MAX_STEAM_TEMP_C = 300.0        # Thermal equipment safety limit
    MAX_SPM = 11.5                  # Surface pumping unit mechanical speed limit
    MIN_SPM = 2.0                   # VFD minimum continuous cooling speed

    @classmethod
    def evaluate_configuration(
        cls,
        steam_volume_tonnes: float,
        steam_pressure_bar: float,
        soak_days: float,
        stroke_length_in: float,
        spm: float,
        sim_summary: dict,
        rod_rating_lbs: float = 28000.0
    ) -> dict:
        violations = []
        warnings = []
        
        # 1. Check Steam Injection Pressure
        if steam_pressure_bar > cls.MAX_STEAM_PRESSURE_BAR:
            violations.append(f"Steam pressure ({steam_pressure_bar} bar) exceeds wellhead safety limit ({cls.MAX_STEAM_PRESSURE_BAR} bar). Risk of casing seal failure.")
            
        # 2. Check SPM limits
        if spm > cls.MAX_SPM:
            violations.append(f"SPM ({spm}) exceeds maximum surface unit speed ({cls.MAX_SPM}). Severe gearbox & structure fatigue risk.")
        elif spm < cls.MIN_SPM:
            warnings.append(f"SPM ({spm}) below recommended minimum ({cls.MIN_SPM}). Potential motor overheating at low VFD frequency.")
            
        # 3. Check Peak Polished Rod Load (PPRL)
        max_load_pct = sim_summary.get("max_rod_load_pct", 0.0)
        if max_load_pct > 90.0:
            violations.append(f"Peak Polished Rod Load ({max_load_pct}% of rating) breaches 90% safety limit. High risk of rod string parted failure.")
        elif max_load_pct > 80.0:
            warnings.append(f"Rod load ({max_load_pct}%) operates in high stress zone (>80%).")
            
        # 4. Check Rod Floating
        if sim_summary.get("is_rod_floating_detected", False):
            violations.append("Severe Rod Floating detected during downstroke due to high fluid viscous drag. Risk of rod buckling and tubing wear.")
            
        # 5. Check Thermal Shock / Soak duration
        if soak_days < 3.0:
            warnings.append("Soak duration < 3 days may cause rapid steam breakthrough and incomplete near-wellbore heat conduction.")
            
        is_safe = len(violations) == 0
        safety_score = 100.0 - (len(violations) * 35.0) - (len(warnings) * 10.0)
        safety_score = max(10.0, min(100.0, safety_score))
        
        return {
            "is_safe": is_safe,
            "safety_score": round(safety_score, 1),
            "risk_level": "LOW" if is_safe and len(warnings) == 0 else ("MEDIUM" if is_safe else "CRITICAL"),
            "violations": violations,
            "warnings": warnings,
            "recommendation_status": "READY_FOR_OPERATOR_REVIEW" if is_safe else "REJECTED_BY_SAFETY_GATE"
        }

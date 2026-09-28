export interface Well {
  id: string;
  name: string;
  field_location: string;
  status: string;
  api_gravity: number;
  reservoir_depth_m: number;
  initial_res_temp_c: number;
  current_res_temp_c: number;
  oil_viscosity_cp: number;
  plunger_diameter_in: number;
  rod_rating_lbs: number;
}

export interface CoupledState {
  timestamp: string;
  well_id: string;
  well_name: string;
  reservoir_tier: {
    reservoir_temperature_c: number;
    initial_temperature_c: number;
    oil_viscosity_cp: number;
    reservoir_pressure_bar: number;
    mobility_index_relative: number;
    thermal_heating_status: string;
  };
  wellbore_tier: {
    depth_m: number;
    bottomhole_temp_c: number;
    wellhead_temp_c: number;
    temp_loss_gradient_c: number;
    flowing_friction_loss_bar: number;
    hydrostatic_head_bar: number;
  };
  srp_tier: {
    spm: number;
    stroke_length_in: number;
    plunger_diameter_in: number;
    pprl_lbs: number;
    mprl_lbs: number;
    rod_load_pct: number;
    pump_fillage_pct: number;
    motor_power_kw: number;
    is_rod_floating: boolean;
    vfd_frequency_hz: number;
  };
  surface_tier: {
    oil_rate_bpd: number;
    water_rate_bpd: number;
    total_liquid_rate_bpd: number;
    water_cut_pct: number;
    steam_to_oil_ratio: number;
    energy_kwh_per_bbl: number;
    composite_health_index: number;
  };
}

export interface HistoricalRecord {
  day: number;
  timestamp: string;
  oil_rate_bpd: number;
  water_rate_bpd: number;
  reservoir_temp_c: number;
  wellhead_temp_c: number;
  oil_viscosity_cp: number;
  sor: number;
  pprl_lbs: number;
  mprl_lbs: number;
  pump_fillage_pct: number;
  energy_kwh_per_bbl: number;
}

export interface DynamometerCardData {
  id?: string;
  timestamp?: string;
  stroke_length_in: number;
  spm: number;
  surface_position_in: number[];
  surface_load_lbs: number[];
  pump_position_in: number[];
  pump_load_lbs: number[];
  diagnostic_label: string;
  fault_confidence: number;
  pprl_lbs?: number;
  mprl_lbs?: number;
}

export interface WhatIfResponse {
  scenario_summary: {
    peak_temp_c: number;
    cumulative_oil_bbl: number;
    average_oil_rate_bpd: number;
    steam_to_oil_ratio: number;
    average_energy_kwh_per_bbl: number;
    average_risk_score: number;
    max_rod_load_pct: number;
    is_rod_floating_detected: boolean;
  };
  baseline_summary: {
    peak_temp_c: number;
    cumulative_oil_bbl: number;
    average_oil_rate_bpd: number;
    steam_to_oil_ratio: number;
    average_energy_kwh_per_bbl: number;
    average_risk_score: number;
  };
  delta_comparison: {
    cumulative_oil_gain_bbl: number;
    cumulative_oil_gain_pct: number;
    sor_delta: number;
    energy_saving_pct: number;
    risk_score_delta: number;
  };
  safety_audit: {
    is_safe: boolean;
    safety_score: number;
    risk_level: string;
    violations: string[];
    warnings: string[];
    recommendation_status: string;
  };
  daily_trajectory: Array<{
    day: number;
    reservoir_temp_c: number;
    wellhead_temp_c: number;
    viscosity_cp: number;
    oil_rate_bpd: number;
    water_rate_bpd: number;
    cumulative_oil_bbl: number;
    fillage_pct: number;
    pprl_lbs: number;
    mprl_lbs: number;
    rod_load_pct: number;
    is_rod_floating: boolean;
    motor_power_kw: number;
    energy_kwh_per_bbl: number;
    sor: number;
    risk_score: number;
  }>;
  dynamometer_card: DynamometerCardData;
}

export interface ParetoSolution {
  params: {
    steam_volume_tonnes: number;
    soak_days: number;
    stroke_length_in: number;
    spm: number;
  };
  objectives: {
    cumulative_oil_bbl: number;
    steam_to_oil_ratio: number;
    energy_kwh_per_bbl: number;
    risk_score: number;
  };
  summary: {
    peak_temp_c: number;
    cumulative_oil_bbl: number;
    steam_to_oil_ratio: number;
    average_energy_kwh_per_bbl: number;
    average_risk_score: number;
    max_rod_load_pct: number;
    is_rod_floating_detected: boolean;
  };
  safety: {
    is_safe: boolean;
    safety_score: number;
    risk_level: string;
  };
  utility_score?: number;
}

export interface OptimizationResponse {
  baseline_configuration: ParetoSolution;
  recommended_optimal: ParetoSolution;
  pareto_solutions: ParetoSolution[];
  improvement_metrics: {
    oil_production_gain_pct: number;
    sor_reduction_pct: number;
    energy_saving_pct: number;
    risk_reduction_points: number;
  };
  total_candidates_evaluated: number;
  feasible_candidates: number;
}

export interface RecommendationItem {
  id: string;
  created_at: string;
  rec_steam_volume: number;
  rec_soak_days: number;
  rec_stroke_length: number;
  rec_spm: number;
  expected_oil_gain_bpd: number;
  expected_sor_reduction: number;
  expected_energy_saving_pct: number;
  safety_score: number;
  risk_level: string;
  approval_status: string;
  engineering_rationale: string;
  pareto_rank: number;
  audit_trail: Array<{
    operator_id: string;
    action: string;
    notes: string;
    timestamp: string;
  }>;
}

export interface RiskAlertItem {
  id: string;
  timestamp: string;
  severity: string;
  alert_type: string;
  description: string;
  contributing_parameters: any;
  is_resolved: boolean;
  resolution_notes?: string;
}

export interface ModelValidationData {
  registered_models: Array<{
    id: string;
    model_name: string;
    version: string;
    trained_at: string;
    mae: number;
    rmse: number;
    r2: number;
    status: string;
  }>;
  active_evaluations: {
    thermal_decline_model: {
      name: string;
      mae_celsius: number;
      rmse_celsius: number;
      r2_score: number;
      validation_split: string;
    };
    production_inflow_model: {
      name: string;
      mae_bpd: number;
      rmse_bpd: number;
      r2_score: number;
      feature_importance_ranking: Record<string, number>;
    };
    dynamometer_classifier: {
      name: string;
      accuracy: number;
      classes: string[];
      diagnostic_coverage: string;
    };
  };
  data_quality_report: {
    total_synthetic_samples: number;
    sampling_frequency: string;
    missing_value_pct: number;
    outlier_rate_pct: number;
    data_consistency_score: number;
  };
}

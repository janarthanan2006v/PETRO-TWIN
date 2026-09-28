import {
  Well, CoupledState, HistoricalRecord, DynamometerCardData,
  WhatIfResponse, OptimizationResponse, RecommendationItem,
  RiskAlertItem, ModelValidationData
} from '../types';

const API_BASE = '/api/v1';

export const api = {
  // Wells
  async getWells(): Promise<Well[]> {
    const res = await fetch(`${API_BASE}/wells/`);
    if (!res.ok) throw new Error('Failed to fetch wells');
    return res.json();
  },

  async getWellDetail(wellId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/wells/${wellId}`);
    if (!res.ok) throw new Error('Failed to fetch well detail');
    return res.json();
  },

  // Telemetry & Coupled Digital Twin
  async getCoupledState(wellId: string): Promise<CoupledState> {
    const res = await fetch(`${API_BASE}/telemetry/coupled-state/${wellId}`);
    if (!res.ok) throw new Error('Failed to fetch coupled state');
    return res.json();
  },

  async getHistoricalTelemetry(wellId: string, days: number = 60): Promise<{ data: HistoricalRecord[] }> {
    const res = await fetch(`${API_BASE}/telemetry/historical/${wellId}?days=${days}`);
    if (!res.ok) throw new Error('Failed to fetch historical data');
    return res.json();
  },

  // CSS Analysis
  async getCSSCycles(wellId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/css/cycles/${wellId}`);
    if (!res.ok) throw new Error('Failed to fetch CSS cycles');
    return res.json();
  },

  async getThermalEfficiency(wellId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/css/thermal-efficiency/${wellId}`);
    if (!res.ok) throw new Error('Failed to fetch thermal efficiency');
    return res.json();
  },

  // SRP Monitoring
  async getSRPStatus(wellId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/srp/status/${wellId}`);
    if (!res.ok) throw new Error('Failed to fetch SRP status');
    return res.json();
  },

  // Dynamometer
  async getDynamometerCards(wellId: string): Promise<DynamometerCardData[]> {
    const res = await fetch(`${API_BASE}/dynamometer/cards/${wellId}`);
    if (!res.ok) throw new Error('Failed to fetch dyno cards');
    return res.json();
  },

  async synthesizeCard(params: any): Promise<{ card_data: DynamometerCardData; ai_diagnosis: any }> {
    const res = await fetch(`${API_BASE}/dynamometer/synthesize-and-diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to synthesize card');
    return res.json();
  },

  // AI Predictions
  async getAIForecast(params: any): Promise<any> {
    const res = await fetch(`${API_BASE}/predictions/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to get AI forecast');
    return res.json();
  },

  // What-If Simulator
  async runWhatIfSimulation(params: any): Promise<WhatIfResponse> {
    const res = await fetch(`${API_BASE}/simulation/run-what-if`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to run what-if simulation');
    return res.json();
  },

  // Optimization (NSGA-II)
  async runOptimization(populationSize: number = 20, generations: number = 4): Promise<OptimizationResponse> {
    const res = await fetch(`${API_BASE}/optimization/run-nsga2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ population_size: populationSize, generations: generations }),
    });
    if (!res.ok) throw new Error('Failed to run optimization');
    return res.json();
  },

  // Recommendations & Approvals
  async getRecommendations(wellId: string): Promise<RecommendationItem[]> {
    const res = await fetch(`${API_BASE}/recommendations/list/${wellId}`);
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  },

  async submitOperatorAction(recId: string, action: string, notes: string, operatorId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/recommendations/action/${recId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, notes, operator_id: operatorId }),
    });
    if (!res.ok) throw new Error('Failed to submit operator action');
    return res.json();
  },

  // Risk Alerts
  async getRiskAlerts(wellId: string): Promise<RiskAlertItem[]> {
    const res = await fetch(`${API_BASE}/risks/alerts/${wellId}`);
    if (!res.ok) throw new Error('Failed to fetch risk alerts');
    return res.json();
  },

  async resolveAlert(alertId: string, notes: string): Promise<any> {
    const res = await fetch(`${API_BASE}/risks/resolve/${alertId}?notes=${encodeURIComponent(notes)}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to resolve alert');
    return res.json();
  },

  // Model Validation
  async getModelMetrics(): Promise<ModelValidationData> {
    const res = await fetch(`${API_BASE}/models/metrics`);
    if (!res.ok) throw new Error('Failed to fetch model metrics');
    return res.json();
  },

  async triggerRecalibration(): Promise<any> {
    const res = await fetch(`${API_BASE}/models/recalibrate`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to recalibrate models');
    return res.json();
  },
};

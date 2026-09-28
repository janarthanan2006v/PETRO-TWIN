import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ModelValidationData, RiskAlertItem } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Database,
  Cpu,
  CheckCircle,
  FileCheck,
  Sparkles
} from 'lucide-react';

interface ModelValidationViewProps {
  wellId: string;
}

export const ModelValidationView: React.FC<ModelValidationViewProps> = ({ wellId }) => {
  const [modelData, setModelData] = useState<ModelValidationData | null>(null);
  const [alerts, setAlerts] = useState<RiskAlertItem[]>([]);
  const [recalibrating, setRecalibrating] = useState(false);
  const [recalibrateStatus, setRecalibrateStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      setLoading(true);
      const [mMetrics, rAlerts] = await Promise.all([
        api.getModelMetrics(),
        api.getRiskAlerts(wellId),
      ]);
      setModelData(mMetrics);
      setAlerts(rAlerts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [wellId]);

  async function handleRecalibrate() {
    try {
      setRecalibrating(true);
      const res = await api.triggerRecalibration();
      setRecalibrateStatus(`Model successfully recalibrated at ${new Date().toLocaleTimeString()} (Thermal R²: ${res.recalibrated_models.thermal_model_r2}, Classifier Acc: ${(res.recalibrated_models.dynamometer_classifier_accuracy * 100).toFixed(1)}%)`);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setRecalibrating(false);
    }
  }

  async function handleResolveAlert(alertId: string) {
    try {
      await api.resolveAlert(alertId, 'Verified and addressed via operational parameter adjustment');
      await loadData();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Recalibration Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>RISK ALERTS, MODEL VALIDATION & RECALIBRATION</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time mechanical hazard detection, chronological model evaluation metrics, and continuous learning pipeline.
          </p>
        </div>

        <button
          onClick={handleRecalibrate}
          disabled={recalibrating}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${recalibrating ? 'animate-spin' : ''}`} />
          <span>{recalibrating ? 'Retraining Models...' : 'Trigger Continuous Recalibration'}</span>
        </button>
      </div>

      {recalibrateStatus && (
        <div className="p-3.5 bg-emerald-950/50 border border-emerald-500/40 rounded-xl flex items-center space-x-2 text-emerald-300 text-xs font-mono">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{recalibrateStatus}</span>
        </div>
      )}

      {/* Active Risk Alerts Section */}
      <div className="glass-panel p-5 rounded-2xl border border-[#1f345e] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1f345e]">
          <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>MECHANICAL HAZARD & OPERATIONAL RISK ALERTS</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {alerts.filter((a) => !a.is_resolved).length} Active Alerts
          </span>
        </div>

        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((a) => (
              <div
                key={a.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono ${
                  a.is_resolved
                    ? 'bg-[#070d18] border-[#1f345e] opacity-60'
                    : a.severity === 'CRITICAL'
                    ? 'bg-rose-950/40 border-rose-500/50'
                    : 'bg-amber-950/40 border-amber-500/50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        a.severity === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-400 border border-rose-500/40'
                          : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {a.severity}
                    </span>
                    <span className="font-bold text-white text-sm">
                      {a.alert_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {a.description}
                  </p>
                  {a.contributing_parameters && (
                    <div className="text-[11px] text-slate-400 flex space-x-3 pt-1">
                      {Object.entries(a.contributing_parameters).map(([k, v]: any) => (
                        <span key={k}>
                          {k}: <strong className="text-white">{v}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center space-x-2">
                  {a.is_resolved ? (
                    <span className="text-emerald-400 text-xs font-mono flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Resolved</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleResolveAlert(a.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#111d35] hover:bg-[#162544] border border-[#1f345e] text-slate-200 hover:text-white text-xs font-mono transition-all"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400 font-mono">
            No active risk alerts recorded.
          </div>
        )}
      </div>

      {/* Model Registry Validation Metrics Grid */}
      {modelData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Thermal Model Evaluation */}
          <div className="glass-panel p-5 rounded-2xl border border-[#1f345e] space-y-3">
            <div className="pb-3 border-b border-[#1f345e]">
              <span className="text-[10px] font-mono text-cyan-400 uppercase block">Model Registry #1</span>
              <h4 className="text-sm font-bold text-white font-mono">
                {modelData.active_evaluations.thermal_decline_model.name}
              </h4>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Mean Absolute Error (MAE):</span>
                <strong className="text-cyan-400">{modelData.active_evaluations.thermal_decline_model.mae_celsius} °C</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Root Mean Squared Error:</span>
                <strong className="text-white">{modelData.active_evaluations.thermal_decline_model.rmse_celsius} °C</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Coefficient of Determination (R²):</span>
                <strong className="text-emerald-400">{modelData.active_evaluations.thermal_decline_model.r2_score}</strong>
              </div>
              <div className="pt-2 border-t border-[#1f345e] text-[11px] text-slate-400">
                Split: {modelData.active_evaluations.thermal_decline_model.validation_split}
              </div>
            </div>
          </div>

          {/* Oil Inflow Model Evaluation */}
          <div className="glass-panel p-5 rounded-2xl border border-[#1f345e] space-y-3">
            <div className="pb-3 border-b border-[#1f345e]">
              <span className="text-[10px] font-mono text-cyan-400 uppercase block">Model Registry #2</span>
              <h4 className="text-sm font-bold text-white font-mono">
                {modelData.active_evaluations.production_inflow_model.name}
              </h4>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">MAE:</span>
                <strong className="text-cyan-400">{modelData.active_evaluations.production_inflow_model.mae_bpd} bpd</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">RMSE:</span>
                <strong className="text-white">{modelData.active_evaluations.production_inflow_model.rmse_bpd} bpd</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">R² Score:</span>
                <strong className="text-emerald-400">{modelData.active_evaluations.production_inflow_model.r2_score}</strong>
              </div>
              <div className="pt-2 border-t border-[#1f345e] text-[11px] text-slate-400">
                Coupled with Vogel's Heavy-Oil IPR equation
              </div>
            </div>
          </div>

          {/* Dynamometer Morphological Classifier */}
          <div className="glass-panel p-5 rounded-2xl border border-[#1f345e] space-y-3">
            <div className="pb-3 border-b border-[#1f345e]">
              <span className="text-[10px] font-mono text-cyan-400 uppercase block">Model Registry #3</span>
              <h4 className="text-sm font-bold text-white font-mono">
                {modelData.active_evaluations.dynamometer_classifier.name}
              </h4>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Multi-class Accuracy:</span>
                <strong className="text-emerald-400">
                  {(modelData.active_evaluations.dynamometer_classifier.accuracy * 100).toFixed(1)}%
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Class Categories:</span>
                <strong className="text-white">6 Failure States</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Feature Extraction:</span>
                <strong className="text-cyan-400">Gibbs Wave Damped Integral</strong>
              </div>
              <div className="pt-2 border-t border-[#1f345e] text-[11px] text-slate-400">
                Coverage: {modelData.active_evaluations.dynamometer_classifier.diagnostic_coverage}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dataset Quality & Integrity Report */}
      {modelData && (
        <div className="glass-panel p-5 rounded-2xl border border-[#1f345e] space-y-3">
          <div className="pb-3 border-b border-[#1f345e] flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>DATA QUALITY & TELEMETRY INTEGRITY AUDIT</span>
            </h3>
            <span className="text-xs font-mono text-emerald-400">
              Score: {modelData.data_quality_report.data_consistency_score}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 bg-[#070d18] rounded-xl border border-[#1f345e]">
              <span className="text-slate-400 block text-[10px]">Total Training Samples</span>
              <span className="text-white font-bold">{modelData.data_quality_report.total_synthetic_samples}</span>
            </div>
            <div className="p-3 bg-[#070d18] rounded-xl border border-[#1f345e]">
              <span className="text-slate-400 block text-[10px]">Sampling Cadence</span>
              <span className="text-white font-bold">{modelData.data_quality_report.sampling_frequency}</span>
            </div>
            <div className="p-3 bg-[#070d18] rounded-xl border border-[#1f345e]">
              <span className="text-slate-400 block text-[10px]">Missing Value Rate</span>
              <span className="text-emerald-400 font-bold">{modelData.data_quality_report.missing_value_pct}%</span>
            </div>
            <div className="p-3 bg-[#070d18] rounded-xl border border-[#1f345e]">
              <span className="text-slate-400 block text-[10px]">Noise / Outlier Tolerance</span>
              <span className="text-cyan-400 font-bold">{modelData.data_quality_report.outlier_rate_pct}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

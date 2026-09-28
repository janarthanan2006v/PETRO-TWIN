import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DynamometerCardData } from '../types';
import { DynoCardCanvas } from '../components/dynamometer/DynoCardCanvas';
import { GitGraph, Brain, AlertTriangle, CheckCircle, RefreshCw, Cpu, Sparkles } from 'lucide-react';

interface DynamometerViewProps {
  wellId: string;
}

export const DynamometerView: React.FC<DynamometerViewProps> = ({ wellId }) => {
  const [selectedFault, setSelectedFault] = useState<string>('NORMAL_OPERATION');
  const [strokeLength, setStrokeLength] = useState<number>(100);
  const [spm, setSpm] = useState<number>(6.5);
  const [viscosity, setViscosity] = useState<number>(95);
  const [fillage, setFillage] = useState<number>(85);

  const [cardData, setCardData] = useState<DynamometerCardData | null>(null);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const faultTypes = [
    { id: 'NORMAL_OPERATION', label: 'Normal Operation', severity: 'NORMAL', desc: 'Full barrel stroke and healthy valve seating.' },
    { id: 'FLUID_POUND', label: 'Fluid Pound', severity: 'HIGH', desc: 'Incomplete barrel liquid fillage causing impact shock.' },
    { id: 'GAS_INTERFERENCE', label: 'Gas Interference', severity: 'MEDIUM', desc: 'Free gas compression cushion on downstroke.' },
    { id: 'ROD_FLOATING', label: 'Rod Floating', severity: 'CRITICAL', desc: 'High heavy-oil viscous drag exceeding buoyant rod weight.' },
    { id: 'WORN_TRAVELING_VALVE', label: 'Worn Traveling Valve', severity: 'MEDIUM', desc: 'Fluid slippage across valve ball and seat on upstroke.' },
    { id: 'MECHANICAL_OVERLOAD', label: 'Mechanical Overload', severity: 'CRITICAL', desc: 'Polished rod load exceeding 90% rod yield strength.' },
  ];

  async function generateAndDiagnose(type: string = selectedFault) {
    try {
      setLoading(true);
      const res = await api.synthesizeCard({
        stroke_length_in: strokeLength,
        spm: spm,
        pprl_lbs: type === 'MECHANICAL_OVERLOAD' ? 28500 : 21500,
        mprl_lbs: type === 'ROD_FLOATING' ? 900 : 6500,
        fluid_viscosity_cp: type === 'ROD_FLOATING' ? 2200 : viscosity,
        fillage_pct: type === 'FLUID_POUND' ? 48 : fillage,
        fault_type: type,
      });
      setCardData(res.card_data);
      setDiagnosis(res.ai_diagnosis);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    generateAndDiagnose(selectedFault);
  }, [selectedFault, strokeLength, spm, viscosity, fillage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
            <GitGraph className="w-5 h-5 text-cyan-400" />
            <span>SRP DYNAMOMETER CARD AI DIAGNOSTIC LAB</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gibbs wave equation downhole pump reconstruction, morphological feature extraction & AI fault classification.
          </p>
        </div>

        <button
          onClick={() => generateAndDiagnose(selectedFault)}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-semibold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-Synthesize & Classify</span>
        </button>
      </div>

      {/* Fault Preset Selectors */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {faultTypes.map((f) => {
          const isSelected = selectedFault === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setSelectedFault(f.id)}
              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-cyan-950/80 border-cyan-400 shadow-md shadow-cyan-500/10'
                  : 'bg-[#0c1527] border-[#1f345e] hover:border-[#2d4b85]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                    f.severity === 'CRITICAL'
                      ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                      : f.severity === 'HIGH'
                      ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {f.severity}
                </span>
                {isSelected && <Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
              </div>
              <div className="text-xs font-bold font-mono text-white truncate">{f.label}</div>
              <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                {f.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Canvas & AI Diagnosis Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas Dynamometer Graph */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-[#1f345e] flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-3 border-b border-[#1f345e] mb-4">
            <span className="text-xs font-bold text-white font-mono flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>GIBBS WAVE CARD: SURFACE (BLUE) vs DOWNHOLE PUMP (GREEN)</span>
            </span>
            <span className="text-xs font-mono text-slate-400">
              Stroke: {strokeLength}" | Speed: {spm} SPM
            </span>
          </div>

          {cardData ? (
            <DynoCardCanvas cardData={cardData} rodRatingLbs={28000} width={620} height={380} />
          ) : (
            <div className="h-96 flex items-center justify-center text-slate-500 font-mono">
              Synthesizing Dynamometer loop...
            </div>
          )}
        </div>

        {/* AI Classifier Output Panel */}
        <div className="glass-panel p-5 rounded-2xl border border-[#1f345e] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-[#1f345e] mb-3">
              <Brain className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono">
                AI MORPHOLOGICAL CLASSIFIER
              </h3>
            </div>

            {diagnosis ? (
              <div className="space-y-4">
                {/* Result Card */}
                <div
                  className={`p-4 rounded-xl border ${
                    diagnosis.severity === 'CRITICAL'
                      ? 'bg-rose-950/40 border-rose-500/50'
                      : diagnosis.severity === 'HIGH'
                      ? 'bg-amber-950/40 border-amber-500/50'
                      : 'bg-emerald-950/40 border-emerald-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300 font-medium">Diagnosed State:</span>
                    <span className="font-bold text-white uppercase text-[10px] px-2 py-0.5 rounded bg-black/40">
                      {(diagnosis.confidence * 100).toFixed(1)}% Confidence
                    </span>
                  </div>
                  <div className="text-lg font-bold font-mono text-white mt-1">
                    {diagnosis.predicted_fault.replace(/_/g, ' ')}
                  </div>
                </div>

                {/* Petroleum Engineering Diagnostic Explanation */}
                <div className="space-y-1">
                  <span className="text-xs font-mono text-slate-400 uppercase">
                    Engineering Mechanism:
                  </span>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed bg-[#070d18] p-3 rounded-xl border border-[#1f345e]">
                    {diagnosis.description}
                  </p>
                </div>

                {/* Class Probability Breakdown */}
                <div className="space-y-2">
                  <span className="text-xs font-mono text-slate-400 uppercase">
                    Class Probability Distribution:
                  </span>
                  <div className="space-y-1.5 text-[11px] font-mono">
                    {Object.entries(diagnosis.class_probabilities || {}).map(([cls, prob]: any) => (
                      <div key={cls} className="space-y-0.5">
                        <div className="flex justify-between text-slate-400">
                          <span className="truncate">{cls.replace(/_/g, ' ')}</span>
                          <span className="text-slate-200">{(prob * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#162544] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              cls === diagnosis.predicted_fault ? 'bg-cyan-400' : 'bg-slate-600'
                            }`}
                            style={{ width: `${Math.max(2, prob * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 font-mono py-8 text-center">
                Awaiting classifier output...
              </div>
            )}
          </div>

          <div className="text-[11px] font-mono text-slate-400 pt-3 border-t border-[#1f345e] text-center">
            Trained on 100-pt Kinematic Wave Harmonics
          </div>
        </div>
      </div>
    </div>
  );
};

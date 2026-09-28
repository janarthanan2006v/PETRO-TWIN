import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { RecommendationItem } from '../types';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  History,
  Send,
  MessageSquare
} from 'lucide-react';

interface RecommendationsViewProps {
  wellId: string;
  onRefreshData?: () => void;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({ wellId, onRefreshData }) => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [selectedRec, setSelectedRec] = useState<RecommendationItem | null>(null);
  const [operatorName, setOperatorName] = useState<string>('Er. R. Sharma (Chief Petroleum Eng.)');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED' | 'FLAGGED_FOR_INSPECTION'>('APPROVED');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadRecommendations() {
    try {
      setLoading(true);
      const data = await api.getRecommendations(wellId);
      setRecommendations(data);
      if (data.length > 0 && !selectedRec) {
        setSelectedRec(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecommendations();
  }, [wellId]);

  async function handleOperatorSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRec) return;

    try {
      setSubmitting(true);
      await api.submitOperatorAction(selectedRec.id, actionType, actionNotes || `${actionType} by operator.`, operatorName);
      await loadRecommendations();
      if (onRefreshData) onRefreshData();
      setActionNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-cyan-400" />
            <span>SAFETY GATE & HUMAN-IN-THE-LOOP OPERATOR ACTION</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Explainable AI decision support, multi-objective constraints verification, and operator approval audit trail.
          </p>
        </div>

        <span className="px-3 py-1 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          Advisory Mode (Zero Autonomous Field Actuation)
        </span>
      </div>

      {/* Recommendations List & Action Modal Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recommendation Cards List */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">
            Operational Recommendations ({recommendations.length})
          </div>

          {recommendations.map((rec) => {
            const isSelected = selectedRec?.id === rec.id;
            return (
              <div
                key={rec.id}
                onClick={() => setSelectedRec(rec)}
                className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2.5 relative overflow-hidden ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-400 shadow-lg shadow-cyan-500/10'
                    : 'bg-[#0c1527] border-[#1f345e] hover:border-[#2d4b85]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white">
                    Pareto Rank #{rec.pareto_rank}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      rec.approval_status === 'APPROVED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                        : rec.approval_status === 'REJECTED'
                        ? 'bg-rose-950 text-rose-400 border border-rose-500/40'
                        : rec.approval_status === 'PENDING_REVIEW'
                        ? 'bg-amber-950 text-amber-400 border border-amber-500/40 animate-pulse'
                        : 'bg-indigo-950 text-indigo-400 border border-indigo-500/40'
                    }`}
                  >
                    {rec.approval_status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#070d18] p-2 rounded-lg border border-[#1f345e]">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Steam Vol</span>
                    <span className="text-white font-bold">{rec.rec_steam_volume} t</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Stroke / SPM</span>
                    <span className="text-white font-bold">{rec.rec_stroke_length}" @ {rec.rec_spm}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                  <span>Gain: <strong className="text-emerald-400">+{rec.expected_oil_gain_bpd} bpd</strong></span>
                  <span>Safety: <strong className="text-cyan-400">{rec.safety_score}%</strong></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Detailed Inspection & Operator Approval Form */}
        <div className="lg:col-span-2 space-y-6">
          {selectedRec ? (
            <div className="glass-panel p-6 rounded-2xl border border-[#1f345e] space-y-5">
              {/* Top Banner */}
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#1f345e] gap-2">
                <div>
                  <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>RECOMMENDATION SPECIFICATION & AUDIT</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {selectedRec.id} | Generated: {selectedRec.created_at ? new Date(selectedRec.created_at).toLocaleString() : 'Recent'}
                  </span>
                </div>

                <span
                  className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase ${
                    selectedRec.approval_status === 'APPROVED'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                      : selectedRec.approval_status === 'REJECTED'
                      ? 'bg-rose-950 text-rose-400 border border-rose-500/40'
                      : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  STATUS: {selectedRec.approval_status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Engineering Rationale Box */}
              <div className="space-y-1.5">
                <span className="text-xs font-mono text-slate-400 uppercase font-bold">
                  Physics & Optimization Rationale:
                </span>
                <p className="text-xs text-slate-200 font-sans leading-relaxed bg-[#070d18] p-4 rounded-xl border border-[#1f345e]">
                  {selectedRec.engineering_rationale}
                </p>
              </div>

              {/* Param Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 bg-[#0c1527] rounded-xl border border-[#1f345e]">
                  <span className="text-slate-400 block text-[10px]">Steam Injection</span>
                  <span className="text-white font-bold text-sm">{selectedRec.rec_steam_volume} t</span>
                </div>
                <div className="p-3 bg-[#0c1527] rounded-xl border border-[#1f345e]">
                  <span className="text-slate-400 block text-[10px]">Soak Duration</span>
                  <span className="text-white font-bold text-sm">{selectedRec.rec_soak_days} Days</span>
                </div>
                <div className="p-3 bg-[#0c1527] rounded-xl border border-[#1f345e]">
                  <span className="text-slate-400 block text-[10px]">Stroke Length</span>
                  <span className="text-white font-bold text-sm">{selectedRec.rec_stroke_length} in</span>
                </div>
                <div className="p-3 bg-[#0c1527] rounded-xl border border-[#1f345e]">
                  <span className="text-slate-400 block text-[10px]">Pumping Speed</span>
                  <span className="text-white font-bold text-sm">{selectedRec.rec_spm} SPM</span>
                </div>
              </div>

              {/* Operator Action Form */}
              <form onSubmit={handleOperatorSubmit} className="p-4 bg-[#070d18] rounded-xl border border-[#1f345e] space-y-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 font-mono uppercase">
                  <UserCheck className="w-4 h-4" />
                  <span>Operator Decision & Validation Signature</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <label className="text-slate-400 block mb-1">Operator Identifier / Role:</label>
                    <input
                      type="text"
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      className="w-full bg-[#0c1527] border border-[#1f345e] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Action Decision:</label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setActionType('APPROVED')}
                        className={`flex-1 py-2 rounded-lg font-bold border transition-all text-xs font-mono flex items-center justify-center space-x-1 ${
                          actionType === 'APPROVED'
                            ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                            : 'bg-[#0c1527] border-[#1f345e] text-slate-400 hover:text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActionType('REJECTED')}
                        className={`flex-1 py-2 rounded-lg font-bold border transition-all text-xs font-mono flex items-center justify-center space-x-1 ${
                          actionType === 'REJECTED'
                            ? 'bg-rose-600 border-rose-400 text-white shadow-md'
                            : 'bg-[#0c1527] border-[#1f345e] text-slate-400 hover:text-white'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActionType('FLAGGED_FOR_INSPECTION')}
                        className={`flex-1 py-2 rounded-lg font-bold border transition-all text-xs font-mono flex items-center justify-center space-x-1 ${
                          actionType === 'FLAGGED_FOR_INSPECTION'
                            ? 'bg-amber-600 border-amber-400 text-white shadow-md'
                            : 'bg-[#0c1527] border-[#1f345e] text-slate-400 hover:text-white'
                        }`}
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 text-xs font-mono">
                    Engineering Audit Notes / Rationale:
                  </label>
                  <textarea
                    rows={2}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Enter operator review justification, safety checks performed, or field constraint overrides..."
                    className="w-full bg-[#0c1527] border border-[#1f345e] rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold rounded-lg transition-all shadow-lg shadow-cyan-500/20 flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Recording Audit Signature...' : 'Submit Operator Signature'}</span>
                  </button>
                </div>
              </form>

              {/* Audit Trail History */}
              {selectedRec.audit_trail && selectedRec.audit_trail.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-[#1f345e]">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 font-mono uppercase">
                    <History className="w-4 h-4 text-cyan-400" />
                    <span>Operator Action Audit Trail History</span>
                  </div>

                  <div className="space-y-2">
                    {selectedRec.audit_trail.map((entry, idx) => (
                      <div key={idx} className="p-3 bg-[#0c1527] rounded-xl border border-[#1f345e] text-xs font-mono space-y-1">
                        <div className="flex justify-between text-slate-300">
                          <strong className="text-cyan-400">{entry.operator_id}</strong>
                          <span className="text-[10px] text-slate-400">{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}</span>
                        </div>
                        <div className="text-[11px] text-emerald-400 font-bold">Action: {entry.action}</div>
                        <div className="text-[11px] text-slate-400 font-sans">{entry.notes}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-8 text-center text-slate-400 font-mono">
              Select a recommendation to inspect and approve.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

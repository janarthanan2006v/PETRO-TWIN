import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  Flame,
  Activity,
  GitGraph,
  TrendingUp,
  Target,
  Sliders,
  CheckSquare,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';

export type PageId =
  | 'overview'
  | 'digital-twin'
  | 'css-analysis'
  | 'srp-monitoring'
  | 'dynamometer'
  | 'ai-predictions'
  | 'optimization'
  | 'what-if'
  | 'recommendations'
  | 'model-validation';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  riskCount: number;
  pendingRecsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  riskCount,
  pendingRecsCount,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'digital-twin', label: 'Coupled Digital Twin', icon: Cpu, badge: '4-Tier' },
    { id: 'css-analysis', label: 'CSS Thermal Cycle', icon: Flame, badge: null },
    { id: 'srp-monitoring', label: 'SRP Monitoring & Rod', icon: Activity, badge: null },
    { id: 'dynamometer', label: 'Dynamometer AI Cards', icon: GitGraph, badge: '6 Faults' },
    { id: 'ai-predictions', label: 'AI Prediction & SHAP', icon: TrendingUp, badge: 'XAI' },
    { id: 'optimization', label: 'NSGA-II Optimization', icon: Target, badge: 'Pareto' },
    { id: 'what-if', label: 'What-If Simulator', icon: Sliders, badge: 'Coupled' },
    {
      id: 'recommendations',
      label: 'Safety & Operator Action',
      icon: CheckSquare,
      badge: pendingRecsCount > 0 ? `${pendingRecsCount} New` : null,
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40',
    },
    {
      id: 'model-validation',
      label: 'Risk Alerts & Model QA',
      icon: ShieldAlert,
      badge: riskCount > 0 ? `${riskCount} Risk` : null,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
    },
  ];

  return (
    <aside className="w-64 bg-[#0c1527] border-r border-[#1f345e] flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16 select-none overflow-y-auto">
      <div className="py-4 space-y-1">
        <div className="px-4 pb-2 text-[11px] font-mono uppercase tracking-wider text-slate-400">
          Navigation Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as PageId)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-cyan-950/50 text-cyan-400 border-r-2 border-cyan-400 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-[#111d35]'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                    item.badgeColor || 'bg-[#162544] text-slate-300 border border-[#1f345e]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Engineering Footer Info */}
      <div className="p-4 border-t border-[#1f345e] bg-[#070d18]/60 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono">Physics Core</span>
          <span className="text-emerald-400 font-mono">Boberg-Lantz + Gibbs</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono">Optimizer</span>
          <span className="text-cyan-400 font-mono">NSGA-II (pymoo)</span>
        </div>
        <div className="pt-2 text-[11px] text-slate-400 text-center font-mono">
          Baghewala Heavy-Oil Pilot
        </div>
      </div>
    </aside>
  );
};

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  colorScheme?: 'cyan' | 'amber' | 'emerald' | 'crimson' | 'purple';
  subText?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  delta,
  deltaType = 'neutral',
  icon: Icon,
  colorScheme = 'cyan',
  subText,
}) => {
  const schemeStyles = {
    cyan: 'border-cyan-500/20 text-cyan-400 bg-cyan-950/20 group-hover:border-cyan-500/50',
    amber: 'border-amber-500/20 text-amber-400 bg-amber-950/20 group-hover:border-amber-500/50',
    emerald: 'border-emerald-500/20 text-emerald-400 bg-emerald-950/20 group-hover:border-emerald-500/50',
    crimson: 'border-rose-500/20 text-rose-400 bg-rose-950/20 group-hover:border-rose-500/50',
    purple: 'border-purple-500/20 text-purple-400 bg-purple-950/20 group-hover:border-purple-500/50',
  };

  return (
    <div className="glass-panel p-4 rounded-xl relative overflow-hidden group hover:border-[#2d4b85] transition-all">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
            {title}
          </span>
          <div className="flex items-baseline space-x-1.5 mt-1.5">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {value}
            </span>
            {unit && <span className="text-xs font-mono text-slate-400">{unit}</span>}
          </div>
        </div>
        <div className={`p-2.5 rounded-lg border ${schemeStyles[colorScheme]} transition-colors`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(delta || subText) && (
        <div className="mt-3 pt-2.5 border-t border-[#1f345e]/50 flex items-center justify-between text-xs font-mono">
          {delta && (
            <span
              className={
                deltaType === 'positive'
                  ? 'text-emerald-400'
                  : deltaType === 'negative'
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }
            >
              {delta}
            </span>
          )}
          {subText && <span className="text-slate-400 text-[11px] truncate">{subText}</span>}
        </div>
      )}
    </div>
  );
};

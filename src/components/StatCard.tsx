import React from 'react';
import { ArrowUpRight, MousePointerClick, ChevronRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  badgeText?: string;
  badgeColor?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo';
  icon: React.ReactNode;
  onClick?: () => void;
  accentGradient?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  badgeText,
  badgeColor = 'cyan',
  icon,
  onClick,
  accentGradient = 'from-cyan-500 to-blue-600'
}) => {
  const badgeColors = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-sm shadow-cyan-950/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm shadow-emerald-950/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-sm shadow-amber-950/30',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-sm shadow-rose-950/30',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-sm shadow-indigo-950/30'
  };

  return (
    <div
      onClick={onClick}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-cyan-500/50 hover:bg-slate-850/90 transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden active:scale-98 select-none"
    >
      {/* Top Accent line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentGradient} opacity-80 group-hover:opacity-100 transition-opacity`}></div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-cyan-300 transition-colors">
            {title}
          </span>
          <div className="p-2.5 bg-slate-800/90 group-hover:bg-cyan-500/20 text-cyan-400 rounded-xl transition-all duration-200 ease-out group-hover:scale-110 group-hover:rotate-6 shadow-md shrink-0 border border-slate-700/60 group-hover:border-cyan-500/40">
            {icon}
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <span className="text-3xl font-extrabold text-white font-mono tracking-tight group-hover:text-cyan-100 transition-colors">
            {value}
          </span>
          {badgeText && (
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${badgeColors[badgeColor]}`}>
              {badgeText}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="truncate">{subtext || 'Klik untuk rincian detail'}</span>
        <div className="flex items-center gap-1 text-cyan-400 font-medium group-hover:translate-x-1 transition-transform shrink-0">
          <span className="text-[11px]">Rincian</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};

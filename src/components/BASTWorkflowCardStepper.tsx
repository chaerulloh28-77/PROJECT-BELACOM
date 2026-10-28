import React from 'react';
import { 
  Check, 
  Clock, 
  AlertCircle, 
  GitBranch
} from 'lucide-react';
import { BASTItem } from '../types';
import { evaluateBASTWorkflow } from '../utils/bastWorkflowHelper';

interface BASTWorkflowCardStepperProps {
  bast: BASTItem;
  onOpenRoutingModal?: () => void;
}

export const BASTWorkflowCardStepper: React.FC<BASTWorkflowCardStepperProps> = ({
  bast,
  onOpenRoutingModal
}) => {
  const summary = evaluateBASTWorkflow(bast);

  return (
    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/90 space-y-2.5">
      {/* Header bar: Title & Progress percentage */}
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
          <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
          <span>Workflow Alur:</span>
          <strong className="text-cyan-300 font-bold truncate max-w-[210px] sm:max-w-[280px]">
            {summary.currentStageTitle}
          </strong>
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
            summary.isAllCompleted
              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
              : 'bg-cyan-950 text-cyan-300 border-cyan-800'
          }`}
        >
          {summary.percent}% Selesai
        </span>
      </div>

      {/* Progress Track Bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            summary.isAllCompleted
              ? 'bg-emerald-500'
              : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500'
          }`}
          style={{ width: `${Math.max(6, summary.percent)}%` }}
        />
      </div>

      {/* 4 Steps Visual Stepper Grid: Hijau = Selesai, Biru = Sedang Berjalan, Abu-abu = Belum */}
      <div className="grid grid-cols-4 gap-1.5 pt-0.5">
        {summary.stages.map((stage) => {
          let stepIcon = <Clock className="w-3 h-3 text-slate-500" />;
          let circleBg = 'bg-slate-800 text-slate-400 border-slate-700'; // Abu-abu = Belum
          let cardBg = 'bg-slate-900/50 border-slate-800/60';
          let labelBadge = 'bg-slate-800 text-slate-400';

          if (stage.state === 'completed') {
            // Hijau = Selesai
            stepIcon = <Check className="w-3 h-3 stroke-[3]" />;
            circleBg = 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold';
            cardBg = 'bg-emerald-950/20 border-emerald-500/30';
            labelBadge = 'bg-emerald-950 text-emerald-300 border border-emerald-800/80';
          } else if (stage.state === 'revision') {
            // Merah = Ada Catatan Revisi
            stepIcon = <AlertCircle className="w-3 h-3 text-rose-400" />;
            circleBg = 'bg-rose-950 text-rose-300 border-rose-500 animate-pulse';
            cardBg = 'bg-rose-950/20 border-rose-500/30';
            labelBadge = 'bg-rose-950 text-rose-300 border border-rose-800/80';
          } else if (stage.state === 'in_progress') {
            // Biru = Sedang Berjalan
            stepIcon = <Clock className="w-3 h-3 animate-spin text-blue-300" style={{ animationDuration: '4s' }} />;
            circleBg = 'bg-blue-600 text-white border-blue-400 font-bold shadow-sm shadow-blue-500/30';
            cardBg = 'bg-blue-950/25 border-blue-500/40 ring-1 ring-blue-500/20';
            labelBadge = 'bg-blue-950 text-blue-300 border border-blue-800/80';
          }

          return (
            <div
              key={stage.stageNumber}
              onClick={onOpenRoutingModal}
              className={`p-1.5 rounded-lg border text-center flex flex-col items-center justify-between transition-colors ${
                onOpenRoutingModal ? 'cursor-pointer hover:brightness-110' : ''
              } ${cardBg}`}
              title={`${stage.title}: ${stage.badgeLabel} ${stage.details ? `(${stage.details})` : ''}`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] mb-1 font-bold ${circleBg}`}
              >
                {stepIcon}
              </div>
              <span className="text-[10px] font-bold text-slate-200 line-clamp-1 leading-tight">
                {stage.stageNumber === 1
                  ? '1. Email'
                  : stage.stageNumber === 2
                  ? '2. Admin'
                  : stage.stageNumber === 3
                  ? '3. TTD'
                  : '4. Finance'}
              </span>
              <span
                className={`text-[9px] font-mono font-semibold px-1 py-0.2 rounded mt-0.5 truncate max-w-full ${labelBadge}`}
              >
                {stage.badgeLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

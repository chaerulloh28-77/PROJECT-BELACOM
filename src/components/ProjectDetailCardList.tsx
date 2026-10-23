import React from 'react';
import { 
  FileText, 
  User, 
  MapPin, 
  Ruler, 
  Users, 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  XCircle, 
  CreditCard,
  X,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { DailyReportItem, BASTItem, InvoiceItem, PenagihanItem } from '../types';

export interface DetailCardItem {
  id: string;
  woNumber: string;
  pic: string;
  assignment: string; // Area e.g. Jabo 1
  team: string;
  workType: string;
  statusLabel: string;
  statusBadgeColor: string;
  estimatedDistanceMeters: number;
  totalDistanceMeters: number;
  nominal?: number;
  notes?: string;
  releaseDate?: string;
  finishDate?: string;
}

interface ProjectDetailCardListProps {
  title: string;
  statusName: string;
  count: number;
  items: DetailCardItem[];
  onClose: () => void;
  onSelectWo?: (woNumber: string) => void;
}

export const ProjectDetailCardList: React.FC<ProjectDetailCardListProps> = ({
  title,
  statusName,
  count,
  items,
  onClose,
  onSelectWo
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 animate-fadeIn">
      
      {/* Header with Title and Reset/Close Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold uppercase font-mono tracking-wider text-slate-100 flex items-center gap-2">
              <span>{title}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                {statusName}
              </span>
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">
              Menampilkan {count} proyek/dokumen yang sesuai dengan irisan status
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700/60 shrink-0 self-start sm:self-auto"
        >
          <X className="w-3.5 h-3.5 text-rose-400" />
          <span>Tutup / Reset Detail</span>
        </button>
      </div>

      {/* Items List Grid */}
      {items.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-xs font-mono bg-slate-950/60 rounded-xl border border-slate-800/80">
          Tidak ada data proyek yang sesuai dengan kriteria filter status "{statusName}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto pr-1">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectWo && onSelectWo(item.woNumber)}
              className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800/80 hover:border-cyan-500/50 p-4 rounded-xl transition-all duration-200 space-y-2.5 shadow-md group cursor-pointer"
            >
              {/* Header WO & Status Pill */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-1.5 font-mono">
                  <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="font-extrabold text-xs text-white group-hover:text-cyan-300 transition-colors">
                    {item.woNumber}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${item.statusBadgeColor}`}>
                  {item.statusLabel}
                </span>
              </div>

              {/* PIC & Assignment Area */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                <div className="flex items-center gap-1.5 truncate">
                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate" title={item.pic}>PIC: {item.pic}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate" title={item.assignment}>Area: {item.assignment}</span>
                </div>
              </div>

              {/* Distance Metrics */}
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/60 text-[11px] font-mono space-y-1">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Ruler className="w-3 h-3 text-cyan-400" /> Est. Jarak:
                  </span>
                  <span className="font-bold text-slate-200">
                    {item.estimatedDistanceMeters.toLocaleString('id-ID')} m
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Ruler className="w-3 h-3 text-emerald-400" /> Total Jarak:
                  </span>
                  <span className="font-bold text-emerald-300">
                    {item.totalDistanceMeters.toLocaleString('id-ID')} m
                  </span>
                </div>
                {item.nominal !== undefined && (
                  <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800/60">
                    <span className="text-slate-500 flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-amber-400" /> Nominal:
                    </span>
                    <span className="font-black text-amber-300 font-mono">
                      Rp {item.nominal.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>

              {/* Work Type & Team Progress Summary */}
              <div className="text-[11px] font-mono space-y-1 pt-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Users className="w-3 h-3 text-blue-400 shrink-0" />
                  <span className="font-semibold text-slate-200">Tim: {item.team}</span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 bg-slate-900/40 p-1.5 rounded border border-slate-800/40 italic">
                  "{item.workType}"
                </p>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

import React from 'react';
import { BaseballPositionCode, LineupSlot, Player } from '../../types';
import { BASEBALL_POSITIONS, getPositionBadgeColor } from '../../constants/baseball';

interface BaseballDiamondProps {
  lineup: LineupSlot[];
  startingPitcher?: Player | null;
  onSlotClick?: (positionCode: BaseballPositionCode) => void;
  selectedPosition?: BaseballPositionCode | null;
}

export const BaseballDiamond: React.FC<BaseballDiamondProps> = ({
  lineup,
  startingPitcher,
  onSlotClick,
  selectedPosition,
}) => {
  // Map defensive code to assigned slot
  const positionMap = new Map<BaseballPositionCode, LineupSlot>();
  lineup.forEach((slot) => {
    if (slot.positionCode) {
      positionMap.set(slot.positionCode, slot);
    }
  });

  const positions: BaseballPositionCode[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'DH'];

  return (
    <div className="relative w-full aspect-[4/3] max-w-2xl mx-auto rounded-2xl bg-gradient-to-b from-emerald-950 via-emerald-900 to-slate-900 border border-emerald-700/40 shadow-2xl overflow-hidden select-none p-4">
      {/* SVG Field graphics */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
        viewBox="0 0 1000 750"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outfield grass arc texture */}
        <path
          d="M 100 650 Q 500 -50 900 650 Z"
          fill="rgba(16, 185, 129, 0.15)"
          stroke="rgba(52, 211, 153, 0.4)"
          strokeWidth="4"
          strokeDasharray="8 6"
        />

        {/* Warning track arc */}
        <path
          d="M 160 620 Q 500 50 840 620"
          stroke="rgba(245, 158, 11, 0.3)"
          strokeWidth="8"
        />

        {/* Foul lines */}
        <line x1="500" y1="660" x2="100" y2="260" stroke="#f1f5f9" strokeWidth="3" strokeOpacity="0.7" />
        <line x1="500" y1="660" x2="900" y2="260" stroke="#f1f5f9" strokeWidth="3" strokeOpacity="0.7" />

        {/* Infield dirt circle */}
        <ellipse cx="500" cy="460" rx="260" ry="200" fill="rgba(180, 83, 9, 0.22)" stroke="rgba(245, 158, 11, 0.3)" strokeWidth="3" />

        {/* Infield grass diamond */}
        <polygon
          points="500,310 700,460 500,610 300,460"
          fill="rgba(5, 150, 105, 0.3)"
          stroke="rgba(255, 255, 255, 0.6)"
          strokeWidth="3"
        />

        {/* Pitcher's mound circle */}
        <circle cx="500" cy="465" r="42" fill="rgba(217, 119, 6, 0.4)" stroke="#fcd34d" strokeWidth="2" />
        <rect x="488" y="462" width="24" height="6" fill="#ffffff" rx="2" />

        {/* Bases */}
        {/* Home Plate */}
        <polygon points="500,660 514,646 514,635 486,635 486,646" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
        {/* 1st Base */}
        <rect x="692" y="452" width="18" height="18" fill="#ffffff" transform="rotate(45 701 461)" />
        {/* 2nd Base */}
        <rect x="491" y="301" width="18" height="18" fill="#ffffff" transform="rotate(45 500 310)" />
        {/* 3rd Base */}
        <rect x="291" y="452" width="18" height="18" fill="#ffffff" transform="rotate(45 300 461)" />

        {/* Batter's boxes */}
        <rect x="450" y="630" width="24" height="42" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" />
        <rect x="526" y="630" width="24" height="42" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" />
        {/* Catcher's box */}
        <path d="M 465 675 L 535 675 L 550 710 L 450 710 Z" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
      </svg>

      {/* Field Title & Compass */}
      <div className="absolute top-3 left-4 flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-slate-900/80 px-3 py-1.5 rounded-full border border-emerald-500/30 backdrop-blur-sm shadow-md">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        야구 표준 수비 포지션 (1~9 + DH)
      </div>

      {/* DH Box Indicator on side */}
      <div className="absolute bottom-3 right-4 text-xs bg-slate-900/90 border border-purple-500/40 rounded-xl p-2 shadow-lg backdrop-blur-sm max-w-[170px]">
        <div className="flex items-center gap-1.5 font-bold text-purple-300 mb-1">
          <span className="px-1.5 py-0.5 rounded bg-purple-700 text-white text-[10px]">DH</span>
          지명타자석
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">투수 대신 타격 전담 (수비 위치 없음)</p>
      </div>

      {/* Interactive Position Nodes */}
      {positions.map((code) => {
        const meta = BASEBALL_POSITIONS[code];
        const assignedSlot = positionMap.get(code);
        const isSelected = selectedPosition === code;
        const isDH = code === 'DH';

        // Use designated coordinates
        const leftPercent = meta.fieldCoordinates.x;
        const topPercent = meta.fieldCoordinates.y;

        return (
          <button
            key={code}
            type="button"
            onClick={() => onSlotClick?.(code)}
            style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-all duration-200 z-10 focus:outline-none ${
              isSelected ? 'scale-110 z-20 ring-4 ring-amber-400 rounded-xl' : 'hover:scale-105'
            }`}
          >
            <div
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border shadow-xl backdrop-blur-md transition-all ${
                assignedSlot
                  ? 'bg-slate-900/95 border-emerald-500/60 text-white hover:border-emerald-400 hover:bg-slate-800'
                  : 'bg-slate-950/80 border-dashed border-slate-600/70 text-slate-400 hover:border-amber-400/80 hover:text-slate-200'
              } ${isSelected ? 'border-amber-400 bg-slate-800' : ''}`}
            >
              {/* Badge with Position Code and Abbr */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 shadow-md ${getPositionBadgeColor(
                  code
                )}`}
              >
                {code}
              </div>

              {/* Player / Position Label */}
              <div className="text-left min-w-[70px] max-w-[110px]">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold tracking-tight text-slate-400">
                    {meta.abbr} · {meta.koreanName}
                  </span>
                </div>
                {assignedSlot ? (
                  <div className="text-xs font-extrabold text-amber-300 truncate flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-mono">#{assignedSlot.backNumber}</span>
                    <span className="truncate">{assignedSlot.playerName}</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 italic">미배정 (선택)</div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

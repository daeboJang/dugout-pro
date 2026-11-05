import React from 'react';
import { POSITION_LIST, BASEBALL_POSITIONS, getPositionBadgeColor } from '../../constants/baseball';
import { Database, GitFork, Shield, Layers, FileSpreadsheet, CheckCircle, Info } from 'lucide-react';

export const DataModelGuide: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
              아마추어 야구 시스템 데이터 모델 & 표준 코드 규격
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              [팀 - 회원 - 선수 - 로스터 - 시합 - 기록] 관계형 구조와 야구 표준 수비/기록 코드 아키텍처
            </p>
          </div>
        </div>
      </div>

      {/* ERD Relationship Diagram */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <GitFork className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          엔티티 관계도 (Entity Relationship Diagram)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          회원이 팀 창단을 신청하여 관리자가 승인하면 해당 회원이 <strong>팀 마스터</strong>가 되며, 선수를 고유번호로 등록하고 프리셋 로스터를 구성합니다.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-3">
          {/* Entity 1: 회원 */}
          <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
              <span>회원 (Member)</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">USER</span>
            </div>
            <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 space-y-1">
              <div>• id (PK)</div>
              <div>• name (이름)</div>
              <div>• email (이메일)</div>
              <div>• role (ADMIN/MASTER/USER)</div>
              <div>• team_id (소속팀 FK)</div>
            </div>
            <div className="pt-2 text-[10px] text-purple-700 dark:text-purple-300 border-t border-slate-200 dark:border-slate-800">
              팀 승인 시 'MASTER' 권한으로 자동 승격
            </div>
          </div>

          {/* Entity 2: 팀 */}
          <div className="bg-slate-50 dark:bg-slate-950/80 border border-blue-200 dark:border-blue-500/40 rounded-2xl p-4 space-y-2 ring-1 ring-blue-500/20">
            <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
              <span>팀 (Team)</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">TEAM</span>
            </div>
            <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 space-y-1">
              <div>• id (PK)</div>
              <div>• name (팀명)</div>
              <div>• city (연고지)</div>
              <div>• master_id (마스터 FK)</div>
              <div>• status (PENDING/APPROVED)</div>
            </div>
            <div className="pt-2 text-[10px] text-blue-700 dark:text-blue-300 border-t border-slate-200 dark:border-slate-800">
              관리자 승인 후 공식 활동 시작
            </div>
          </div>

          {/* Entity 3: 선수 */}
          <div className="bg-slate-50 dark:bg-slate-950/80 border border-emerald-200 dark:border-emerald-500/40 rounded-2xl p-4 space-y-2 ring-1 ring-emerald-500/20">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>선수 (Player)</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">PLAYER</span>
            </div>
            <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 space-y-1">
              <div>• id (자동생성 고유번호 PK)</div>
              <div>• team_id (소속팀 FK)</div>
              <div>• name (선수명)</div>
              <div>• back_number (등번호)</div>
              <div>• primary_position (1~9/DH)</div>
            </div>
            <div className="pt-2 text-[10px] text-emerald-700 dark:text-emerald-300 border-t border-slate-200 dark:border-slate-800">
              팀 마스터가 선수단 등록 및 관리
            </div>
          </div>

          {/* Entity 4: 로스터 */}
          <div className="bg-slate-50 dark:bg-slate-950/80 border border-amber-200 dark:border-amber-500/40 rounded-2xl p-4 space-y-2 ring-1 ring-amber-500/20">
            <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
              <span>로스터 (Roster)</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">PRESET</span>
            </div>
            <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 space-y-1">
              <div>• id (PK)</div>
              <div>• team_id (소속팀 FK)</div>
              <div>• lineup_json (1~9번 타순)</div>
              <div>• defense_codes (수비위치)</div>
              <div>• is_default (기본 프리셋)</div>
            </div>
            <div className="pt-2 text-[10px] text-amber-700 dark:text-amber-300 border-t border-slate-200 dark:border-slate-800">
              시합 시 원클릭 프리셋으로 로딩
            </div>
          </div>

          {/* Entity 5: 시합 & 기록 */}
          <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 space-y-2 opacity-75">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>시합 & 기록</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">향후 연계</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 space-y-1">
              <div>• match_id (시합 FK)</div>
              <div>• home/away_roster_id</div>
              <div>• record_code (표준기록)</div>
              <div>• inning / boxscore</div>
            </div>
            <div className="pt-2 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 italic">
              (요청에 따라 UI 제외 및 스키마 설계 완료)
            </div>
          </div>
        </div>
      </div>

      {/* Official Baseball Standard Defensive Position Codes */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              야구 공식 표준 수비 포지션 번호 체계 (Official Defensive Numbers 1~9 + DH)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              야구 경기 규칙 공식 제1조 및 수비 스코어 기록에 사용되는 1번~9번 고유 번호입니다.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {POSITION_LIST.map((pos) => (
            <div
              key={pos.code}
              className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${getPositionBadgeColor(
                    pos.code
                  )}`}
                >
                  {pos.code}
                </span>
                <span className="text-xs font-bold font-mono text-amber-600 dark:text-amber-300">{pos.abbr}</span>
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{pos.koreanName}</h4>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{pos.name}</div>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pt-1 border-t border-slate-200 dark:border-slate-800/80">
                {pos.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Official Baseball Play-by-Play Record Codes */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          야구 공식 경기 기록 표준 코드 (Record Codes Reference)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          향후 시합 기록 시스템 연동 시 활용되는 KBO/MLB 공인 기록 약어 표준표입니다.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs pt-1">
          {[
            { code: '1B / H', name: '1루타 (단타)', desc: '단일 안타' },
            { code: '2B', name: '2루타', desc: '2루타 장타' },
            { code: '3B', name: '3루타', desc: '3루타 장타' },
            { code: 'HR', name: '홈런', desc: '본루타/펜스오버' },
            { code: 'BB', name: '볼넷 (사구)', desc: '사사구 출루' },
            { code: 'HBP', name: '몸에 맞는 공', desc: '데드볼 사구' },
            { code: 'SO / K', name: '삼진 아웃', desc: '투수 탈삼진' },
            { code: 'GO (6-3 등)', name: '땅볼 아웃', desc: '내야 땅볼 아웃' },
            { code: 'FO (8등)', name: '뜬공 아웃', desc: '외야 플라이' },
            { code: 'DP', name: '병살타', desc: '더블플레이' },
            { code: 'SB', name: '도루 성공', desc: '베이스 스틸' },
            { code: 'RBI', name: '타점', desc: '득점 연결 타격' },
          ].map((item) => (
            <div key={item.code} className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm block">{item.code}</span>
              <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{item.name}</div>
              <div className="text-[10px] text-slate-500">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

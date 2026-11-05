import React from 'react';
import { Member, Team } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import {
  Users,
  Building2,
  Layers,
  FileText,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Shield,
  Award,
  Sun,
  Moon,
} from 'lucide-react';

interface HeaderProps {
  currentMember: Member;
  members: Member[];
  teams: Team[];
  activeView: 'admin' | 'master' | 'user' | 'guide';
  onViewChange: (view: 'admin' | 'master' | 'user' | 'guide') => void;
  onMemberChange: (memberId: string) => void;
  onResetDatabase: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMember,
  members,
  teams,
  activeView,
  onViewChange,
  onMemberChange,
  onResetDatabase,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const pendingCount = teams.filter((t) => t.status === 'PENDING').length;
  const userTeam = teams.find((t) => t.id === currentMember.team_id || t.master_id === currentMember.id);

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-emerald-500 p-0.5 shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center text-xl">
              ⚾
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                Dugout Pro
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  더그아웃 프로
                </span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              회원 기반 아마추어 야구팀 & 선수 로스터 관리 시스템
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs shadow-inner">
          {/* Admin Dashboard */}
          <button
            onClick={() => onViewChange('admin')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'admin'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
            관리자 대시보드
            {pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-ping" />
            )}
          </button>

          {/* Team Master View */}
          <button
            onClick={() => onViewChange('master')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'master'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            팀 & 선수단 관리
          </button>

          {/* User Team View / Apply */}
          <button
            onClick={() => onViewChange('user')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'user'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            {userTeam?.status === 'PENDING' ? '신청 현황' : '팀 창단 신청'}
          </button>

          {/* Architecture & Code Guide */}
          <button
            onClick={() => onViewChange('guide')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'guide'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            표준코드 & 설계
          </button>
        </nav>

        {/* Right side: Persona Switcher, Dark Mode Toggle, and Database Reset */}
        <div className="flex items-center gap-2">
          {/* Persona Switcher Dropdown */}
          <div className="relative flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-1.5 text-xs shadow-sm">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold hidden lg:inline">현재 계정:</span>
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0"
              style={{ backgroundColor: currentMember.avatar_color || '#3b82f6' }}
            >
              {currentMember.name[0]}
            </div>

            <select
              value={currentMember.id}
              onChange={(e) => onMemberChange(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-100 font-bold text-xs focus:outline-none cursor-pointer pr-4"
            >
              {members.map((m) => {
                const team = teams.find((t) => t.id === m.team_id);
                return (
                  <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                    [{m.role === 'ADMIN' ? '관리자' : m.role === 'MASTER' ? '팀마스터' : '회원'}] {m.name}
                    {team ? ` (${team.name})` : m.id === 'mem_user_applicant' ? ' (인천 타이탄스 신청자)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-300 transition-all shadow-sm flex items-center justify-center"
            title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          {/* Database Reset Button */}
          <button
            onClick={onResetDatabase}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 bg-slate-100 dark:bg-slate-900 rounded-xl transition-colors border border-slate-200 dark:border-slate-800 shadow-sm"
            title="데이터베이스 데모 초기 상태로 리셋"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

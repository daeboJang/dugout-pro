import React, { useState, useEffect } from 'react';
import { Member, Team } from './types';
import { api } from './services/api';
import { Header } from './components/common/Header';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { TeamMasterHub } from './components/master/TeamMasterHub';
import { UserTeamView } from './components/user/UserTeamView';
import { DataModelGuide } from './components/architecture/DataModelGuide';
import { Shield, Award, Building2, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [members, setMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'admin' | 'master' | 'user' | 'guide'>('master');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Initial load
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const [membersData, teamsData] = await Promise.all([api.getMembers(), api.getTeams()]);
      setMembers(membersData);
      setTeams(teamsData);

      // Default active member: Team Master 이승엽 (team_dragons)
      if (!currentMember && membersData.length > 0) {
        const defaultMaster = membersData.find((m) => m.id === 'mem_master_1') || membersData[0];
        setCurrentMember(defaultMaster);
        const teamForMaster = teamsData.find((t) => t.id === defaultMaster.team_id || t.master_id === defaultMaster.id);
        setSelectedTeamId(teamForMaster?.id || teamsData[0]?.id || null);
        setActiveView('master');
      } else if (currentMember) {
        // Refresh current member state
        const updated = membersData.find((m) => m.id === currentMember.id);
        if (updated) setCurrentMember(updated);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle switching active member persona
  const handleMemberChange = (memberId: string) => {
    const selected = members.find((m) => m.id === memberId);
    if (!selected) return;
    setCurrentMember(selected);

    // Auto route view based on persona
    if (selected.role === 'ADMIN') {
      setActiveView('admin');
    } else if (selected.role === 'MASTER') {
      const masterTeam = teams.find((t) => t.id === selected.team_id || t.master_id === selected.id);
      if (masterTeam) {
        setSelectedTeamId(masterTeam.id);
      }
      setActiveView('master');
    } else {
      // General user
      setActiveView('user');
    }
  };

  // Reset database to initial seed data
  const handleResetDatabase = async () => {
    if (!confirm('데이터베이스를 초기 데모 데이터(팀 3개, 선수단 14명, 기본 로스터)로 리셋하시겠습니까?')) {
      return;
    }
    try {
      setIsLoading(true);
      await api.resetDatabase();
      await loadInitialData();
      alert('데이터베이스가 초기화되었습니다.');
    } catch (err: any) {
      alert(err.message || '초기화 실패');
    } finally {
      setIsLoading(false);
    }
  };

  // Currently selected team object for TeamMasterHub
  const activeTeam =
    teams.find((t) => t.id === selectedTeamId) ||
    teams.find((t) => t.status === 'APPROVED') ||
    teams[0];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Top Header */}
      {currentMember && (
        <Header
          currentMember={currentMember}
          members={members}
          teams={teams}
          activeView={activeView}
          onViewChange={setActiveView}
          onMemberChange={handleMemberChange}
          onResetDatabase={handleResetDatabase}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-950/60 border border-red-800 rounded-2xl flex items-center justify-between text-xs text-red-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={loadInitialData}
              className="px-3 py-1 bg-red-900/60 hover:bg-red-800 text-white rounded-lg transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> 다시 시도
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-2xl animate-bounce">
              ⚾
            </div>
            <p className="text-xs font-semibold text-slate-400">데이터베이스를 불러오는 중입니다...</p>
          </div>
        ) : (
          <>
            {/* 1. Admin Dashboard View */}
            {activeView === 'admin' && (
              <AdminDashboard
                teams={teams}
                members={members}
                onRefreshData={loadInitialData}
                onSelectTeamForMasterView={(teamId) => {
                  setSelectedTeamId(teamId);
                  setActiveView('master');
                }}
              />
            )}

            {/* 2. Team Master View */}
            {activeView === 'master' && (
              <div className="space-y-6">
                {/* Team selector pill if user wants to switch which team to inspect */}
                {teams.filter((t) => t.status === 'APPROVED').length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                    <span className="text-slate-400 font-semibold shrink-0">관리 대상 팀:</span>
                    {teams
                      .filter((t) => t.status === 'APPROVED')
                      .map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTeamId(t.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                            activeTeam?.id === t.id
                              ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          <span>⚾ {t.name}</span>
                          <span className="text-[10px] opacity-75 font-mono">({t.player_count || 0}명)</span>
                        </button>
                      ))}
                  </div>
                )}

                {activeTeam ? (
                  <TeamMasterHub
                    team={activeTeam}
                    currentMember={currentMember!}
                    onTeamUpdated={loadInitialData}
                  />
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">현재 승인된 팀이 없습니다</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      관리자 대시보드에서 대기 중인 팀 창단 신청을 승인하거나, 신규 팀을 신청해주세요.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 3. User / Member Team View */}
            {activeView === 'user' && (
              <UserTeamView
                currentMember={currentMember!}
                teams={teams}
                onRequestSubmitted={loadInitialData}
                onSwitchToAdmin={() => {
                  handleMemberChange('mem_admin');
                }}
              />
            )}

            {/* 4. Architecture & Standard Baseball Codes Guide */}
            {activeView === 'guide' && <DataModelGuide />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-900 dark:text-slate-300">Dugout Pro</span>
            <span>·</span>
            <span>아마추어 야구단 & 선수 로스터 관리 시스템</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            야구 표준 수비코드(1~9번/DH) 규격 준수 · SQLite 데이터베이스 기반
          </div>
        </div>
      </footer>
    </div>
  );
}

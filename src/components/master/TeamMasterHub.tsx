import React, { useState, useEffect } from 'react';
import { Team, Player, Member } from '../../types';
import { BASEBALL_POSITIONS, getPositionBadgeColor } from '../../constants/baseball';
import { PlayerModal } from './PlayerModal';
import { RosterPresetBuilder } from './RosterPresetBuilder';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';
import {
  Users,
  UserPlus,
  Layers,
  Settings,
  Search,
  Filter,
  Trash2,
  Edit2,
  Sparkles,
  MapPin,
  Calendar,
  Shield,
  Activity,
  AlertTriangle,
  HeartPulse,
  Grid,
  List,
  CheckCircle,
} from 'lucide-react';

interface TeamMasterHubProps {
  team: Team;
  currentMember: Member;
  onTeamUpdated?: () => void;
}

export const TeamMasterHub: React.FC<TeamMasterHubProps> = ({
  team,
  currentMember,
  onTeamUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'players' | 'roster' | 'settings'>('players');
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Player modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlayerForEdit, setSelectedPlayerForEdit] = useState<Player | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Team settings form state
  const [teamDesc, setTeamDesc] = useState(team.description || '');
  const [teamCity, setTeamCity] = useState(team.city);
  const [teamYear, setTeamYear] = useState(team.foundation_year || new Date().getFullYear());
  const [isSavingTeam, setIsSavingTeam] = useState(false);

  const loadPlayers = async () => {
    try {
      setIsLoading(true);
      const res = await api.getPlayers(team.id);
      setPlayers(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, [team.id]);

  const showNotification = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  // Register or edit player
  const handleSavePlayer = async (playerData: any) => {
    if (playerData.id) {
      // Update
      await api.updatePlayer(team.id, playerData.id, playerData);
      showNotification(`선수 [${playerData.name}]의 프로필이 수정되었습니다.`);
    } else {
      // Create
      await api.registerPlayer(team.id, playerData);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      showNotification(`신규 선수 [${playerData.name}] (등번호 #${playerData.back_number})이 성공적으로 등록되었습니다.`);
    }
    loadPlayers();
    onTeamUpdated?.();
  };

  // Delete player
  const handleDeletePlayer = async (player: Player) => {
    if (!confirm(`정말 #${player.back_number} ${player.name} 선수를 등록 해제하시겠습니까?`)) {
      return;
    }
    try {
      await api.deletePlayer(team.id, player.id);
      showNotification(`${player.name} 선수가 등록 해제되었습니다.`);
      loadPlayers();
      onTeamUpdated?.();
    } catch (err: any) {
      alert(err.message || '선수 삭제 중 오류가 발생했습니다.');
    }
  };

  // Toggle quick player status (ACTIVE -> INJURED -> REST -> ACTIVE)
  const handleToggleStatus = async (player: Player) => {
    const nextStatus =
      player.status === 'ACTIVE' ? 'INJURED' : player.status === 'INJURED' ? 'REST' : 'ACTIVE';
    try {
      await api.updatePlayer(team.id, player.id, { status: nextStatus });
      loadPlayers();
    } catch (err: any) {
      console.error(err);
    }
  };

  // Batch generate sample players for quick testing
  const handleBatchAddSamples = async () => {
    try {
      setIsLoading(true);
      const res = await api.batchAddSamplePlayers(team.id);
      confetti({ particleCount: 50, spread: 60 });
      showNotification(`테스트용 선수 ${res.count}명이 일괄 등록되었습니다.`);
      loadPlayers();
      onTeamUpdated?.();
    } catch (err: any) {
      alert(err.message || '일괄 추가 중 오류 발생');
    } finally {
      setIsLoading(false);
    }
  };

  // Save team settings
  const handleSaveTeamSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingTeam(true);
      await api.updateTeam(team.id, {
        description: teamDesc,
        city: teamCity,
        foundation_year: teamYear,
      });
      showNotification('팀 기본 정보가 성공적으로 변경되었습니다.');
      onTeamUpdated?.();
    } catch (err: any) {
      alert(err.message || '팀 정보 저장 실패');
    } finally {
      setIsSavingTeam(false);
    }
  };

  // Filter players
  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.back_number).includes(searchQuery) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPosition =
      positionFilter === 'ALL'
        ? true
        : positionFilter === 'PITCHER'
        ? p.primary_position === '1'
        : positionFilter === 'CATCHER'
        ? p.primary_position === '2'
        : positionFilter === 'INFIELD'
        ? ['3', '4', '5', '6'].includes(p.primary_position)
        : positionFilter === 'OUTFIELD'
        ? ['7', '8', '9'].includes(p.primary_position)
        : positionFilter === 'DH'
        ? p.primary_position === 'DH'
        : true;

    const matchesStatus = statusFilter === 'ALL' ? true : p.status === statusFilter;

    return matchesSearch && matchesPosition && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Team Master Header Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-blue-950/70 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-blue-400/50 flex items-center justify-center text-3xl shadow-xl shrink-0">
              ⚾
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  팀 마스터 관리 센터
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> 공식 승인 팀
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> {team.city}
                </span>
                {team.foundation_year && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> {team.foundation_year}년 창단
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
                {team.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {team.description || '등록된 팀 소개글이 없습니다.'}
              </p>
              <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
                <span>
                  팀 마스터: <strong className="text-blue-300">{team.master_name}</strong>
                </span>
                <span>·</span>
                <span>
                  소속 선수: <strong className="text-emerald-400">{players.length}명</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action in Header */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => {
                setSelectedPlayerForEdit(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              선수 등록하기
            </button>
            <button
              onClick={handleBatchAddSamples}
              disabled={isLoading}
              className="px-3.5 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              title="5명의 테스트 선수를 등번호와 함께 일괄 등록합니다"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              선수 5명 일괄 추가
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="relative z-10 flex items-center gap-2 mt-6 pt-5 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('players')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'players'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/10 dark:bg-slate-900/60 text-slate-200 dark:text-slate-400 hover:text-white hover:bg-white/20 dark:hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            선수단 관리 ({players.length}명)
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'roster'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/10 dark:bg-slate-900/60 text-slate-200 dark:text-slate-400 hover:text-white hover:bg-white/20 dark:hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            로스터 프리셋 빌더
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/10 dark:bg-slate-900/60 text-slate-200 dark:text-slate-400 hover:text-white hover:bg-white/20 dark:hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            팀 정보 설정
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="flex items-center gap-2 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/80 rounded-xl animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Tab 1: Squad & Players Management */}
      {activeTab === 'players' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="선수명, 등번호, 고유번호 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Position & Status Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                {[
                  { key: 'ALL', label: '전체' },
                  { key: 'PITCHER', label: '투수[1]' },
                  { key: 'CATCHER', label: '포수[2]' },
                  { key: 'INFIELD', label: '내야[3~6]' },
                  { key: 'OUTFIELD', label: '외야[7~9]' },
                  { key: 'DH', label: '지명타자[DH]' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setPositionFilter(item.key)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      positionFilter === item.key
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">전체 상태</option>
                <option value="ACTIVE">정상출전</option>
                <option value="INJURED">부상자</option>
                <option value="REST">휴식/불참</option>
              </select>

              {/* View toggle */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                  title="카드 그리드 뷰"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                  title="테이블 뷰"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Empty State */}
          {filteredPlayers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm dark:shadow-xl transition-colors">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/80 mx-auto flex items-center justify-center text-3xl mb-3">
                ⚾
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">등록된 선수가 없거나 검색 결과가 없습니다</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                팀 마스터 권한으로 신규 선수를 직접 등록하거나, 빠른 테스트를 위해 샘플 선수를 일괄 추가해보세요.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setSelectedPlayerForEdit(null);
                    setIsModalOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-sm"
                >
                  선수 직접 등록하기
                </button>
                <button
                  onClick={handleBatchAddSamples}
                  className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
                >
                  샘플 선수 5명 추가
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPlayers.map((player) => {
                const posMeta = BASEBALL_POSITIONS[player.primary_position];
                const secMeta = player.secondary_position ? BASEBALL_POSITIONS[player.secondary_position] : null;

                return (
                  <div
                    key={player.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-slate-700 rounded-2xl p-4 shadow-sm dark:shadow-xl transition-all group flex flex-col justify-between"
                  >
                    <div>
                      {/* Top row: Uniform number jersey + Position Badge */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          {/* Jersey number circle */}
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-950 border border-blue-300 dark:border-blue-500/40 flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                            <span className="text-[9px] uppercase font-mono text-slate-400 dark:text-slate-500 leading-none">NO</span>
                            <span className="text-sm font-black leading-none">{player.back_number}</span>
                          </div>

                          <div>
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                              {player.name}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{player.id}</span>
                          </div>
                        </div>

                        {/* Position Code Pill */}
                        <div
                          className={`px-2.5 py-1 rounded-lg text-xs font-black shadow-sm flex items-center gap-1 ${getPositionBadgeColor(
                            player.primary_position
                          )}`}
                          title={posMeta?.desc}
                        >
                          <span>{player.primary_position}</span>
                          <span className="text-[10px] opacity-80">{posMeta?.abbr}</span>
                        </div>
                      </div>

                      {/* Position & Hand info */}
                      <div className="space-y-1.5 py-2 border-y border-slate-100 dark:border-slate-800/80 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">포지션</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {posMeta?.koreanName}
                            {secMeta && (
                              <span className="text-[10px] text-slate-400 ml-1">
                                (부: {secMeta.koreanName})
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">투타 유형</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {player.throwing_hand} · {player.batting_hand}
                          </span>
                        </div>
                        {player.birthdate && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-slate-400 text-[11px]">생년월일</span>
                            <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">{player.birthdate}</span>
                          </div>
                        )}
                      </div>

                      {/* Player Notes */}
                      {player.notes && (
                        <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed italic bg-slate-50 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800/60">
                          "{player.notes}"
                        </p>
                      )}
                    </div>

                    {/* Bottom Status & Action Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleStatus(player)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                          player.status === 'ACTIVE'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                            : player.status === 'INJURED'
                            ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30'
                            : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
                        }`}
                        title="클릭하여 상태 변경 (정상출전 ↔ 부상 ↔ 휴식)"
                      >
                        {player.status === 'ACTIVE'
                          ? '● 정상출전'
                          : player.status === 'INJURED'
                          ? '● 부상명단'
                          : '● 휴식/불참'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedPlayerForEdit(player);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="프로필 수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePlayer(player)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                          title="선수 등록 해제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl transition-colors">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">등번호</th>
                    <th className="px-4 py-3">선수명</th>
                    <th className="px-4 py-3">고유 식별번호</th>
                    <th className="px-4 py-3">주포지션 (표준코드)</th>
                    <th className="px-4 py-3">부포지션</th>
                    <th className="px-4 py-3">투타</th>
                    <th className="px-4 py-3">출전상태</th>
                    <th className="px-4 py-3 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredPlayers.map((player) => {
                    const posMeta = BASEBALL_POSITIONS[player.primary_position];
                    const secMeta = player.secondary_position ? BASEBALL_POSITIONS[player.secondary_position] : null;

                    return (
                      <tr key={player.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                          #{player.back_number}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{player.name}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-400 dark:text-slate-500">{player.id}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-black mr-1.5 ${getPositionBadgeColor(
                              player.primary_position
                            )}`}
                          >
                            {player.primary_position}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {posMeta?.abbr} {posMeta?.koreanName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {secMeta ? `${secMeta.code}:${secMeta.koreanName}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {player.throwing_hand}{player.batting_hand}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleStatus(player)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                              player.status === 'ACTIVE'
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                                : player.status === 'INJURED'
                                ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30'
                                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
                            }`}
                          >
                            {player.status === 'ACTIVE' ? '정상출전' : player.status === 'INJURED' ? '부상명단' : '휴식/불참'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setSelectedPlayerForEdit(player);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePlayer(player)}
                              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Roster Preset Builder */}
      {activeTab === 'roster' && (
        <RosterPresetBuilder team={team} players={players} onRosterUpdated={onTeamUpdated} />
      )}

      {/* Tab 3: Team Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl max-w-2xl transition-colors">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">팀 기본 정보 관리</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">팀명, 연고지 및 소개글을 수정합니다.</p>
            </div>
          </div>

          <form onSubmit={handleSaveTeamSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">팀명</label>
              <input
                type="text"
                value={team.name}
                readOnly
                className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 font-bold cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                팀명 변경은 리그 협회 관리자 승인이 필요합니다.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  활동 연고지 / 홈그라운드
                </label>
                <input
                  type="text"
                  required
                  value={teamCity}
                  onChange={(e) => setTeamCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">창단 연도</label>
                <input
                  type="number"
                  min="1950"
                  max="2030"
                  value={teamYear}
                  onChange={(e) => setTeamYear(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">팀 소개 및 활동 목적</label>
              <textarea
                rows={3}
                value={teamDesc}
                onChange={(e) => setTeamDesc(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingTeam}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-md shadow-blue-600/30"
              >
                {isSavingTeam ? '저장 중...' : '변경사항 저장하기'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Player Registration & Edit Modal */}
      <PlayerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPlayerForEdit(null);
        }}
        onSubmit={handleSavePlayer}
        existingPlayer={selectedPlayerForEdit}
        team={team}
        existingPlayers={players}
      />
    </div>
  );
};

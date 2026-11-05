import React, { useState } from 'react';
import { Team, Member, Player } from '../../types';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Award,
  AlertCircle,
  Search,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Building2,
  Calendar,
  MapPin,
  RefreshCw,
  Plus,
} from 'lucide-react';

interface AdminDashboardProps {
  teams: Team[];
  members: Member[];
  onRefreshData: () => void;
  onSelectTeamForMasterView?: (teamId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  teams,
  members,
  onRefreshData,
  onSelectTeamForMasterView,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'teams' | 'members'>('pending');
  const [teamSearch, setTeamSearch] = useState('');
  const [teamStatusFilter, setTeamStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');

  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<'ALL' | 'ADMIN' | 'MASTER' | 'USER'>('ALL');

  // Approval / rejection modal state
  const [rejectingTeam, setRejectingTeam] = useState<Team | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Add member modal state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'USER' | 'MASTER' | 'ADMIN'>('USER');

  const pendingTeams = teams.filter((t) => t.status === 'PENDING');
  const approvedTeams = teams.filter((t) => t.status === 'APPROVED');
  const totalPlayersCount = teams.reduce((acc, t) => acc + (t.player_count || 0), 0);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // Approve Team
  const handleApproveTeam = async (team: Team) => {
    try {
      setIsProcessing(true);
      await api.updateTeamStatus(team.id, 'APPROVED', '운영위원회 창단 요건 심사 통과 완료');
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.5 },
      });
      showToast(`[${team.name}] 창단이 승인되었습니다! 신청자 (${team.master_name})가 '팀 마스터'로 승격되었습니다.`);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || '승인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit Rejection
  const handleRejectTeam = async () => {
    if (!rejectingTeam) return;
    try {
      setIsProcessing(true);
      await api.updateTeamStatus(rejectingTeam.id, 'REJECTED', rejectReason || '창단 요건 미비 (서류 보완 필요)');
      showToast(`[${rejectingTeam.name}] 창단 신청이 반려되었습니다.`);
      setRejectingTeam(null);
      setRejectReason('');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || '반려 처리 중 오류 발생');
    } finally {
      setIsProcessing(false);
    }
  };

  // Change member role
  const handleChangeRole = async (memberId: string, newRole: 'ADMIN' | 'MASTER' | 'USER') => {
    try {
      await api.updateMember(memberId, { role: newRole });
      showToast(`회원 권한이 [${newRole}]로 변경되었습니다.`);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || '권한 변경 실패');
    }
  };

  // Create member
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMember({
        name: newMemberName.trim(),
        email: newMemberEmail.trim(),
        phone: newMemberPhone.trim(),
        role: newMemberRole,
      });
      showToast(`신규 회원 [${newMemberName}] 등록이 완료되었습니다.`);
      setIsAddMemberOpen(false);
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberPhone('');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || '회원 등록 실패');
    }
  };

  // Filtered teams
  const filteredTeams = teams.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
      t.city.toLowerCase().includes(teamSearch.toLowerCase()) ||
      t.master_name.toLowerCase().includes(teamSearch.toLowerCase());
    const matchStatus = teamStatusFilter === 'ALL' ? true : t.status === teamStatusFilter;
    return matchSearch && matchStatus;
  });

  // Filtered members
  const filteredMembers = members.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (m.nickname && m.nickname.toLowerCase().includes(memberSearch.toLowerCase()));
    const matchRole = memberRoleFilter === 'ALL' ? true : m.role === memberRoleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Pending Approvals */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              창단 승인 대기
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{pendingTeams.length}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">건 심사 대기</span>
          </div>
          {pendingTeams.length > 0 && (
            <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-300 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-ping"></span>
              신규 야구단 창단 신청서 검토 필요
            </div>
          )}
        </div>

        {/* Stat 2: Total Teams */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              등록된 야구단
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{approvedTeams.length}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">개 팀 공식 활동중 (총 {teams.length}개)</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            주말 리그 및 친선 토너먼트 참가 구단
          </p>
        </div>

        {/* Stat 3: Registered Players */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              등록 선수 현황
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{totalPlayersCount}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">명 등록됨</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            고유식별번호 및 표준수비코드 부여 완료
          </p>
        </div>

        {/* Stat 4: Total Members */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              총 회원 수
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{members.length}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">명 회원 계정</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="text-red-500 dark:text-red-400 font-semibold">관리자 {members.filter((m) => m.role === 'ADMIN').length}</span>
            <span>·</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">마스터 {members.filter((m) => m.role === 'MASTER').length}</span>
            <span>·</span>
            <span className="text-slate-500 dark:text-slate-400">일반 {members.filter((m) => m.role === 'USER').length}</span>
          </div>
        </div>
      </div>

      {/* Success Feedback Alert */}
      {successToast && (
        <div className="flex items-center gap-2 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/80 rounded-xl animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Admin Tab Navigation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-sm dark:shadow-xl flex flex-wrap items-center justify-between gap-2 transition-colors">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            팀 생성 승인 심사
            {pendingTeams.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                {pendingTeams.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('teams')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'teams'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            전체 팀 관리 ({teams.length})
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'members'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            회원 및 권한 관리 ({members.length})
          </button>
        </div>

        <button
          onClick={onRefreshData}
          className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center gap-1.5"
          title="데이터 새로고침"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          새로고침
        </button>
      </div>

      {/* Tab 1: Pending Approvals */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                신규 팀 창단 승인 심사 대기열 ({pendingTeams.length}건)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                일반 회원이 제출한 팀 창단 신청서입니다. 승인 시 신청 회원은 자동으로 해당 팀의 '팀 마스터'로 승격됩니다.
              </p>
            </div>
          </div>

          {pendingTeams.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm dark:shadow-xl">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 dark:text-emerald-400 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">심사 대기 중인 팀 창단 신청이 없습니다</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                모든 팀 신청이 처리되었습니다. 상단 페르소나에서 '최신규(일반회원)'로 전환하여 팀 생성 신청을 직접 테스트해보실 수 있습니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingTeams.map((team) => (
                <div
                  key={team.id}
                  className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/30 rounded-2xl p-6 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 dark:border-amber-500/40">
                          승인 심사 대기중
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {team.city}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {team.foundation_year}년 창단 예정
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span className="text-2xl">🔥</span> {team.name}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {team.description || '소개글 미작성'}
                        </p>
                      </div>

                      {/* Request Reason & Master applicant */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                        <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                            신청 회원 (승인 시 팀 마스터 예정)
                          </span>
                          <div className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-600/30 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-black">
                              {team.master_name[0]}
                            </span>
                            {team.master_name}
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">({team.master_id})</span>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                            창단 목적 및 신청 사유
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 line-clamp-2">
                            {team.request_reason || '아마추어 야구팀 창단 및 주말 리그 참가'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Approve / Reject */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 justify-center">
                      <button
                        onClick={() => handleApproveTeam(team)}
                        disabled={isProcessing}
                        className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-md dark:shadow-lg dark:shadow-emerald-600/30 flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        창단 승인 (마스터 권한 부여)
                      </button>

                      <button
                        onClick={() => {
                          setRejectingTeam(team);
                          setRejectReason('');
                        }}
                        disabled={isProcessing}
                        className="px-5 py-2.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/60 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-300 border border-slate-200 dark:border-slate-700 rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                        신청 반려하기
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Total Teams Directory */}
      {activeTab === 'teams' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="팀명, 연고지, 마스터 이름 검색..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              {(['ALL', 'APPROVED', 'PENDING', 'REJECTED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setTeamStatusFilter(status)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    teamStatusFilter === status ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {status === 'ALL'
                    ? '전체'
                    : status === 'APPROVED'
                    ? '승인완료'
                    : status === 'PENDING'
                    ? '승인대기'
                    : '반려됨'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl transition-colors">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">팀명</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">연고지</th>
                  <th className="px-4 py-3">팀 마스터</th>
                  <th className="px-4 py-3 text-center">선수 수</th>
                  <th className="px-4 py-3 text-center">로스터</th>
                  <th className="px-4 py-3 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredTeams.map((team) => (
                  <tr key={team.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="text-base">⚾</span>
                      <div>
                        <div>{team.name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{team.id}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          team.status === 'APPROVED'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
                            : team.status === 'PENDING'
                            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
                            : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30'
                        }`}
                      >
                        {team.status === 'APPROVED'
                          ? '공식 승인'
                          : team.status === 'PENDING'
                          ? '심사 대기'
                          : '신청 반려'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{team.city}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{team.master_name}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {team.player_count || 0}명
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-600 dark:text-slate-300">
                      {team.roster_count || 0}개
                    </td>
                    <td className="px-4 py-3 text-right">
                      {team.status === 'APPROVED' && onSelectTeamForMasterView && (
                        <button
                          onClick={() => onSelectTeamForMasterView(team.id)}
                          className="px-3 py-1 text-xs font-semibold bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-100 dark:hover:bg-blue-600/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          팀 선수단 열기 <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Members & Role Management */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="회원 이름, 이메일, 닉네임 검색..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                {(['ALL', 'ADMIN', 'MASTER', 'USER'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setMemberRoleFilter(role)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      memberRoleFilter === role ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {role === 'ALL'
                      ? '전체'
                      : role === 'ADMIN'
                      ? '관리자'
                      : role === 'MASTER'
                      ? '팀 마스터'
                      : '일반회원'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsAddMemberOpen(true)}
                className="px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-4 h-4" /> 신규 회원 등록
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl transition-colors">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">회원명</th>
                  <th className="px-4 py-3">이메일</th>
                  <th className="px-4 py-3">연락처</th>
                  <th className="px-4 py-3">현재 권한</th>
                  <th className="px-4 py-3">소속 팀</th>
                  <th className="px-4 py-3 text-right">권한 변경</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredMembers.map((member) => {
                  const assignedTeam = teams.find((t) => t.id === member.team_id);

                  return (
                    <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs text-white"
                          style={{ backgroundColor: member.avatar_color || '#3b82f6' }}
                        >
                          {member.name[0]}
                        </div>
                        <div>
                          <div>{member.name}</div>
                          {member.nickname && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">별칭: {member.nickname}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{member.email}</td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{member.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            member.role === 'ADMIN'
                              ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30'
                              : member.role === 'MASTER'
                              ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/30'
                              : 'bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600/30'
                          }`}
                        >
                          {member.role === 'ADMIN'
                            ? '👑 관리자'
                            : member.role === 'MASTER'
                            ? '⚾ 팀 마스터'
                            : '👤 일반 회원'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {assignedTeam ? (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{assignedTeam.name}</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">미소속</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleChangeRole(member.id, e.target.value as 'ADMIN' | 'MASTER' | 'USER')
                          }
                          className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                        >
                          <option value="USER">일반회원 (USER)</option>
                          <option value="MASTER">팀 마스터 (MASTER)</option>
                          <option value="ADMIN">관리자 (ADMIN)</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 transition-colors">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
              [{rejectingTeam.name}] 창단 신청 반려
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              반려 사유를 입력해주시면 신청 회원 ({rejectingTeam.master_name})에게 피드백으로 전달됩니다.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="예: 선수단 최소 인원(9명) 미확보 또는 홈구장 사용 계획서 보완 필요"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-red-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingTeam(null)}
                className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl"
              >
                취소
              </button>
              <button
                onClick={handleRejectTeam}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg shadow-red-600/30"
              >
                반려 처리 확정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 transition-colors">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              신규 회원 등록
            </h3>
            <form onSubmit={handleCreateMember} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">이름 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 강타자"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">이메일 *</label>
                <input
                  type="email"
                  required
                  placeholder="예: batter@example.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">연락처</label>
                <input
                  type="text"
                  placeholder="예: 010-1234-5678"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">권한</label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="USER">일반회원 (USER)</option>
                  <option value="MASTER">팀 마스터 (MASTER)</option>
                  <option value="ADMIN">관리자 (ADMIN)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md"
                >
                  등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

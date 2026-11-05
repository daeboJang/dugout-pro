import React, { useState } from 'react';
import { Member, Team } from '../../types';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';
import {
  ShieldAlert,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  Sparkles,
  ArrowRight,
  MapPin,
  Calendar,
  AlertCircle,
  UserCheck,
} from 'lucide-react';

interface UserTeamViewProps {
  currentMember: Member;
  teams: Team[];
  onRequestSubmitted: () => void;
  onSwitchToAdmin: () => void;
}

export const UserTeamView: React.FC<UserTeamViewProps> = ({
  currentMember,
  teams,
  onRequestSubmitted,
  onSwitchToAdmin,
}) => {
  // Find if user has a pending, approved, or rejected team
  const userTeam = teams.find((t) => t.master_id === currentMember.id || t.id === currentMember.team_id);

  const [teamName, setTeamName] = useState('');
  const [city, setCity] = useState('');
  const [foundationYear, setFoundationYear] = useState(new Date().getFullYear());
  const [description, setDescription] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!teamName.trim() || !city.trim()) {
      setErrorMsg('팀명과 연고지는 필수 입력 항목입니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.requestTeamCreation({
        name: teamName.trim(),
        city: city.trim(),
        foundation_year: Number(foundationYear),
        description: description.trim(),
        request_reason: requestReason.trim() || '아마추어 야구팀 창단 및 리그 참가',
        master_id: currentMember.id,
        master_name: currentMember.name,
        color,
        emblem_icon: 'baseball',
      });

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });

      setSuccessMsg('팀 창단 신청서가 협회 운영위원회에 성공적으로 제출되었습니다!');
      onRequestSubmitted();
    } catch (err: any) {
      setErrorMsg(err.message || '팀 창단 신청 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Case 1: Member has a PENDING team application
  if (userTeam && userTeam.status === 'PENDING') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Pulsing glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40">
                  심사 대기중
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  [{userTeam.name}] 창단 신청서가 심사 중입니다
                </h2>
              </div>
            </div>

            {/* Stepper */}
            <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-4">창단 진행 단계</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/40 rounded-xl flex items-center gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">1. 신청서 제출</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-500">완료됨</div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-500/60 rounded-xl flex items-center gap-2.5 ring-2 ring-amber-500/20">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 animate-spin" />
                  <div>
                    <div className="text-xs font-bold text-amber-800 dark:text-amber-300">2. 협회 심의</div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">관리자 검토 중</div>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2.5 opacity-60">
                  <UserCheck className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400">3. 마스터 승격</div>
                    <div className="text-[10px] text-slate-500">선수 등록 및 로스터 활성화</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Detail Summary */}
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 text-xs">
              <h4 className="font-bold text-slate-700 dark:text-slate-300">제출된 신청 내역</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[11px]">팀명</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{userTeam.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">연고지</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{userTeam.city}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">신청자 (마스터 후보)</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{userTeam.master_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">창단 목표연도</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{userTeam.foundation_year}년</span>
                </div>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">창단 취지 및 신청 사유</span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed bg-white dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  {userTeam.request_reason || '아마추어 야구팀 창단'}
                </p>
              </div>
            </div>

            {/* Interactive Fast Approval Action */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-slate-900 border border-blue-200 dark:border-blue-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 text-xs text-blue-900 dark:text-blue-300">
                <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>체험 안내:</strong> 관리자 계정으로 전환하면 이 팀을 즉시 승인하여 팀 마스터 권한 승격을 체험할 수 있습니다.
                </span>
              </div>
              <button
                onClick={onSwitchToAdmin}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5 shrink-0"
              >
                관리자로 전환하여 승인하기 <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Member's application was REJECTED
  if (userTeam && userTeam.status === 'REJECTED') {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-red-300 dark:border-red-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/40 flex items-center justify-center text-red-600 dark:text-red-400">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-500/40">
              신청 반려됨
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
              [{userTeam.name}] 창단 신청이 반려되었습니다
            </h2>
          </div>
        </div>

        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl text-xs text-red-800 dark:text-red-300 space-y-1">
          <div className="font-bold text-red-900 dark:text-red-200">협회 관리자 피드백 / 반려 사유:</div>
          <p className="leading-relaxed">
            "{userTeam.admin_notes || '창단 최소 요건 미비로 인해 반려되었습니다. 서류를 보완하여 재신청해주세요.'}"
          </p>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          내용을 보완하여 새로운 야구단 창단을 다시 신청하실 수 있습니다.
        </p>
      </div>
    );
  }

  // Case 3: No team yet -> Team Creation Request Form
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">신규 아마추어 야구단 창단 신청</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              창단 신청서 제출 후 협회 관리자의 승인을 거쳐 <strong>팀 마스터</strong>로 승격됩니다.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-3 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-xl">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Applicant Info Banner */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">신청 회원 (승인 시 팀 마스터)</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {currentMember.name} ({currentMember.email})
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              팀명 (구단 명칭) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="예: 송도 바이퍼스, 강남 블리츠"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                활동 연고지 / 지역 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="예: 서울 송파구 탄천구장"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                창단 목표 연도
              </label>
              <input
                type="number"
                min="1990"
                max="2030"
                value={foundationYear}
                onChange={(e) => setFoundationYear(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              팀 소개 및 모토
            </label>
            <textarea
              rows={2}
              placeholder="예: 매주 일요일 정기 경기 진행, 승패보다 팀워크와 매너를 최우선으로 하는 팀입니다."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              창단 취지 및 리그 참가 신청 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="예: 지역 사회인 야구 동호인 15명이 정기 모임을 결성하여, 2026년 아마추어 주말 리그 2부 참가 및 공인 활동을 위해 창단을 신청합니다."
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 text-xs font-bold bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? '신청서 제출 중...' : '협회에 팀 창단 승인 신청서 제출하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

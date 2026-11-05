import React, { useState, useEffect } from 'react';
import { Player, BaseballPositionCode, Team } from '../../types';
import { BASEBALL_POSITIONS, POSITION_LIST, getPositionBadgeColor } from '../../constants/baseball';
import { X, RefreshCw, AlertCircle, Shield, Award, Check } from 'lucide-react';

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (playerData: {
    id?: string;
    name: string;
    back_number: number;
    primary_position: BaseballPositionCode;
    secondary_position?: BaseballPositionCode | null;
    batting_hand: '우타' | '좌타' | '양타';
    throwing_hand: '우투' | '좌투';
    birthdate?: string;
    status: 'ACTIVE' | 'INJURED' | 'REST';
    notes?: string;
    custom_id?: string;
  }) => Promise<void>;
  existingPlayer?: Player | null;
  team: Team;
  existingPlayers: Player[];
}

export const PlayerModal: React.FC<PlayerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingPlayer,
  team,
  existingPlayers,
}) => {
  const isEditing = Boolean(existingPlayer);

  const generatePlayerId = () => {
    const teamPrefix = team.name ? team.name.replace(/\s+/g, '').slice(0, 3).toUpperCase() : 'PLY';
    const num = Math.floor(1000 + Math.random() * 9000);
    return `PLY-${teamPrefix}-${num}`;
  };

  const [playerId, setPlayerId] = useState(existingPlayer?.id || generatePlayerId());
  const [name, setName] = useState(existingPlayer?.name || '');
  const [backNumber, setBackNumber] = useState<number | ''>(existingPlayer?.back_number ?? '');
  const [primaryPos, setPrimaryPos] = useState<BaseballPositionCode>(existingPlayer?.primary_position || '1');
  const [secondaryPos, setSecondaryPos] = useState<BaseballPositionCode | ''>(existingPlayer?.secondary_position || '');
  const [battingHand, setBattingHand] = useState<'우타' | '좌타' | '양타'>(existingPlayer?.batting_hand || '우타');
  const [throwingHand, setThrowingHand] = useState<'우투' | '좌투'>(existingPlayer?.throwing_hand || '우투');
  const [birthdate, setBirthdate] = useState(existingPlayer?.birthdate || '1995-01-01');
  const [status, setStatus] = useState<'ACTIVE' | 'INJURED' | 'REST'>(existingPlayer?.status || 'ACTIVE');
  const [notes, setNotes] = useState(existingPlayer?.notes || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingPlayer) {
      setPlayerId(existingPlayer.id);
      setName(existingPlayer.name);
      setBackNumber(existingPlayer.back_number);
      setPrimaryPos(existingPlayer.primary_position);
      setSecondaryPos(existingPlayer.secondary_position || '');
      setBattingHand(existingPlayer.batting_hand);
      setThrowingHand(existingPlayer.throwing_hand);
      setBirthdate(existingPlayer.birthdate || '1995-01-01');
      setStatus(existingPlayer.status);
      setNotes(existingPlayer.notes || '');
    } else {
      setPlayerId(generatePlayerId());
      setName('');
      // Suggest first unused number
      const usedNumbers = existingPlayers.map((p) => p.back_number);
      let suggested = 1;
      while (usedNumbers.includes(suggested) && suggested <= 99) {
        suggested++;
      }
      setBackNumber(suggested <= 99 ? suggested : '');
      setPrimaryPos('1');
      setSecondaryPos('');
      setBattingHand('우타');
      setThrowingHand('우투');
      setBirthdate('1995-01-01');
      setStatus('ACTIVE');
      setNotes('');
    }
    setErrorMsg('');
  }, [existingPlayer, isOpen]);

  if (!isOpen) return null;

  // Check uniform number duplication
  const isDuplicateNumber =
    backNumber !== '' &&
    existingPlayers.some(
      (p) => p.back_number === Number(backNumber) && (!existingPlayer || p.id !== existingPlayer.id)
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('선수 이름을 입력해주세요.');
      return;
    }

    if (backNumber === '' || isNaN(Number(backNumber)) || Number(backNumber) < 0 || Number(backNumber) > 99) {
      setErrorMsg('등번호는 0부터 99 사이의 숫자를 입력해주세요.');
      return;
    }

    if (isDuplicateNumber) {
      setErrorMsg(`등번호 ${backNumber}번은 이미 팀 내 다른 선수가 사용 중입니다.`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        id: existingPlayer?.id,
        custom_id: playerId,
        name: name.trim(),
        back_number: Number(backNumber),
        primary_position: primaryPos,
        secondary_position: secondaryPos ? (secondaryPos as BaseballPositionCode) : null,
        batting_hand: battingHand,
        throwing_hand: throwingHand,
        birthdate,
        status,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '선수 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isEditing ? '선수 프로필 수정' : '신규 선수 등록'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                소속: <span className="text-blue-600 dark:text-blue-400 font-semibold">{team.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Player Unique ID (Auto-generated) */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                선수 고유번호 (자동 생성 시스템 식별자)
              </label>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setPlayerId(generatePlayerId())}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 hover:underline font-semibold"
                >
                  <RefreshCw className="w-3 h-3" /> 재발급
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={playerId}
                readOnly
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-lg text-amber-700 dark:text-amber-300 cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-500 whitespace-nowrap">고유 식별코드</span>
            </div>
          </div>

          {/* Name & Uniform Back Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                선수 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="예: 홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  등번호 (0~99) <span className="text-red-500">*</span>
                </label>
                {isDuplicateNumber && (
                  <span className="text-[11px] text-red-500 dark:text-red-400 font-semibold">이미 사용 중인 번호</span>
                )}
              </div>
              <input
                type="number"
                min="0"
                max="99"
                required
                placeholder="예: 7"
                value={backNumber}
                onChange={(e) => setBackNumber(e.target.value === '' ? '' : Number(e.target.value))}
                className={`w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none ${
                  isDuplicateNumber
                    ? 'border-red-500 text-red-500 focus:ring-red-500'
                    : 'border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Standard Baseball Position Codes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                주포지션 (야구 표준 코드) <span className="text-red-500">*</span>
              </label>
              <select
                value={primaryPos}
                onChange={(e) => setPrimaryPos(e.target.value as BaseballPositionCode)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {POSITION_LIST.map((pos) => (
                  <option key={pos.code} value={pos.code}>
                    [{pos.code}] {pos.abbr} - {pos.koreanName} ({pos.name})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {BASEBALL_POSITIONS[primaryPos]?.desc}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                부포지션 (보조 포지션)
              </label>
              <select
                value={secondaryPos}
                onChange={(e) => setSecondaryPos(e.target.value as BaseballPositionCode | '')}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="">없음 (주포지션 전담)</option>
                {POSITION_LIST.map((pos) => (
                  <option key={pos.code} value={pos.code} disabled={pos.code === primaryPos}>
                    [{pos.code}] {pos.abbr} - {pos.koreanName}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-500">
                멀티 포지션 소화 가능 시 선택
              </p>
            </div>
          </div>

          {/* Throwing / Batting Hand (투타) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                투구 손 (투수/송구)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['우투', '좌투'] as const).map((hand) => (
                  <button
                    key={hand}
                    type="button"
                    onClick={() => setThrowingHand(hand)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      throwingHand === hand
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {hand}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                타격 손 (타석)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['우타', '좌타', '양타'] as const).map((hand) => (
                  <button
                    key={hand}
                    type="button"
                    onClick={() => setBattingHand(hand)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      battingHand === hand
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {hand}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Status & Birthdate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                출전 상태
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'ACTIVE', label: '정상출전', color: 'text-emerald-600 dark:text-emerald-400' },
                  { key: 'INJURED', label: '부상명단', color: 'text-red-600 dark:text-red-400' },
                  { key: 'REST', label: '휴식/불참', color: 'text-amber-600 dark:text-amber-400' },
                ].map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setStatus(s.key as any)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      status === s.key
                        ? 'bg-white dark:bg-slate-800 border-slate-400 dark:border-slate-500 text-slate-900 dark:text-white shadow-sm ring-1 ring-blue-500'
                        : 'bg-slate-100 dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <span className={status === s.key ? s.color : ''}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                생년월일 (연령대 확인용)
              </label>
              <input
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Notes / Scouter memo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              특이사항 및 메모 (구속, 장타력, 수비 전문성 등)
            </label>
            <textarea
              rows={2}
              placeholder="예: 최고 구속 120km 직구, 슬라이더 주무기. 팀 내 주장 역할 담당."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || Boolean(isDuplicateNumber)}
            className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            {isEditing ? '변경사항 저장' : '선수 등록 완료'}
          </button>
        </div>
      </div>
    </div>
  );
};

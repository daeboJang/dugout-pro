import React, { useState, useEffect } from 'react';
import { Team, Player, RosterPreset, LineupSlot, BaseballPositionCode } from '../../types';
import { BASEBALL_POSITIONS, POSITION_LIST, BATTING_ROLES, getPositionBadgeColor } from '../../constants/baseball';
import { BaseballDiamond } from '../roster/BaseballDiamond';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';
import {
  Save,
  Plus,
  Trash2,
  CheckCircle,
  Copy,
  ArrowUp,
  ArrowDown,
  Wand2,
  Users,
  ShieldAlert,
  Star,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';

interface RosterPresetBuilderProps {
  team: Team;
  players: Player[];
  onRosterUpdated?: () => void;
}

export const RosterPresetBuilder: React.FC<RosterPresetBuilderProps> = ({
  team,
  players,
  onRosterUpdated,
}) => {
  const [presets, setPresets] = useState<RosterPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [presetName, setPresetName] = useState('');
  const [presetDesc, setPresetDesc] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [dhRule, setDhRule] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState<BaseballPositionCode | null>(null);

  // 9 batting slots
  const [lineup, setLineup] = useState<LineupSlot[]>([]);
  // Bullpen & bench
  const [bullpenRole, setBullpenRole] = useState<{ role: string; playerId: string }[]>([
    { role: '선발투수', playerId: '' },
    { role: '중간계투(셋업)', playerId: '' },
    { role: '마무리투수', playerId: '' },
  ]);
  const [benchPlayerIds, setBenchPlayerIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Fetch presets for this team
  const loadPresets = async () => {
    try {
      setIsLoading(true);
      const res = await api.getRosters(team.id);
      setPresets(res);
      if (res.length > 0) {
        // Select default preset or first preset
        const defaultPreset = res.find((r) => r.is_default === 1) || res[0];
        loadPresetIntoState(defaultPreset);
      } else {
        createNewEmptyPreset();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPresets();
  }, [team.id]);

  const loadPresetIntoState = (preset: RosterPreset) => {
    setSelectedPresetId(preset.id);
    setPresetName(preset.name);
    setPresetDesc(preset.description || '');
    setIsDefault(preset.is_default === 1);
    setDhRule(preset.dh_rule === 1);

    try {
      const parsedLineup: LineupSlot[] = JSON.parse(preset.lineup_json || '[]');
      setLineup(parsedLineup);
    } catch (e) {
      setLineup([]);
    }

    try {
      const parsedBullpen = JSON.parse(preset.bullpen_json || '[]');
      if (Array.isArray(parsedBullpen) && parsedBullpen.length > 0) {
        setBullpenRole(parsedBullpen);
      }
    } catch (e) {}

    try {
      const parsedBench = JSON.parse(preset.bench_json || '[]');
      if (Array.isArray(parsedBench)) {
        setBenchPlayerIds(parsedBench.map((b: any) => b.playerId || b));
      }
    } catch (e) {}
  };

  const createNewEmptyPreset = () => {
    setSelectedPresetId(null);
    setPresetName(`${team.name} 신규 라인업 프리셋 #${presets.length + 1}`);
    setPresetDesc('공식 주말 경기용 선발 로스터 프리셋');
    setIsDefault(presets.length === 0);
    setDhRule(true);

    // Initial default 9 slots
    const standardPositions: BaseballPositionCode[] = ['7', '4', '8', '3', 'DH', '5', '2', '6', '9'];
    const initialSlots: LineupSlot[] = standardPositions.map((posCode, idx) => {
      const order = idx + 1;
      const matchedPlayer = players.find((p) => p.primary_position === posCode);
      return {
        battingOrder: order,
        playerId: matchedPlayer?.id || '',
        playerName: matchedPlayer?.name || '',
        backNumber: matchedPlayer?.back_number || 0,
        positionCode: posCode,
        positionName: BASEBALL_POSITIONS[posCode]?.koreanName || '',
        role: order <= 2 ? '테이블세터' : order <= 5 ? '클린업트리오' : '하위타선',
      };
    });

    setLineup(initialSlots);

    // Default pitcher
    const pitcher = players.find((p) => p.primary_position === '1');
    setBullpenRole([
      { role: '선발투수', playerId: pitcher?.id || '' },
      { role: '중간계투(셋업)', playerId: '' },
      { role: '마무리투수', playerId: '' },
    ]);
    setBenchPlayerIds([]);
  };

  // Auto-fill lineup smartly by player primary position
  const handleAutoFill = () => {
    if (players.length === 0) return;

    const availablePlayers = [...players];
    const assignedIds = new Set<string>();

    const targetPositions: BaseballPositionCode[] = ['7', '4', '8', '3', 'DH', '5', '2', '6', '9'];

    const newSlots: LineupSlot[] = targetPositions.map((targetPos, idx) => {
      const order = idx + 1;
      // 1. Look for unassigned player with matching primary position
      let found = availablePlayers.find((p) => !assignedIds.has(p.id) && p.primary_position === targetPos);
      // 2. Look for player with matching secondary position
      if (!found) {
        found = availablePlayers.find((p) => !assignedIds.has(p.id) && p.secondary_position === targetPos);
      }
      // 3. Any unassigned player
      if (!found) {
        found = availablePlayers.find((p) => !assignedIds.has(p.id));
      }

      if (found) {
        assignedIds.add(found.id);
        return {
          battingOrder: order,
          playerId: found.id,
          playerName: found.name,
          backNumber: found.back_number,
          positionCode: targetPos,
          positionName: BASEBALL_POSITIONS[targetPos]?.koreanName || '',
          role: order <= 2 ? '테이블세터' : order <= 5 ? '클린업트리오' : '하위타선',
        };
      } else {
        return {
          battingOrder: order,
          playerId: '',
          playerName: '',
          backNumber: 0,
          positionCode: targetPos,
          positionName: BASEBALL_POSITIONS[targetPos]?.koreanName || '',
          role: order <= 2 ? '테이블세터' : order <= 5 ? '클린업트리오' : '하위타선',
        };
      }
    });

    setLineup(newSlots);

    // Auto set pitcher
    const ace = players.find((p) => p.primary_position === '1');
    if (ace) {
      setBullpenRole((prev) => [
        { role: '선발투수', playerId: ace.id },
        prev[1] || { role: '중간계투(셋업)', playerId: '' },
        prev[2] || { role: '마무리투수', playerId: '' },
      ]);
    }
  };

  // Slot changes
  const updateSlotPlayer = (index: number, playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    const updated = [...lineup];
    if (player) {
      updated[index] = {
        ...updated[index],
        playerId: player.id,
        playerName: player.name,
        backNumber: player.back_number,
      };
    } else {
      updated[index] = {
        ...updated[index],
        playerId: '',
        playerName: '',
        backNumber: 0,
      };
    }
    setLineup(updated);
  };

  const updateSlotPosition = (index: number, code: BaseballPositionCode) => {
    const updated = [...lineup];
    updated[index] = {
      ...updated[index],
      positionCode: code,
      positionName: BASEBALL_POSITIONS[code]?.koreanName || '',
    };
    setLineup(updated);
  };

  // Swap batting order slots
  const moveSlot = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lineup.length) return;

    const updated = [...lineup];
    const temp = { ...updated[index] };
    updated[index] = { ...updated[targetIndex], battingOrder: index + 1 };
    updated[targetIndex] = { ...temp, battingOrder: targetIndex + 1 };

    // Update role names based on new order
    updated.forEach((slot, idx) => {
      const order = idx + 1;
      slot.battingOrder = order;
      slot.role = order <= 2 ? '테이블세터' : order <= 5 ? '클린업트리오' : '하위타선';
    });

    setLineup(updated);
  };

  // Validation
  const assignedPlayerIds = lineup.filter((s) => s.playerId).map((s) => s.playerId);
  const duplicatePlayerIds = assignedPlayerIds.filter(
    (id, index) => assignedPlayerIds.indexOf(id) !== index
  );
  const uniquePositionsFilled = new Set(lineup.map((s) => s.positionCode));
  const missingDefensePositions = (['1', '2', '3', '4', '5', '6', '7', '8', '9'] as BaseballPositionCode[]).filter(
    (code) => {
      // If DH rule is on, Pitcher (1) can be from bullpen
      if (dhRule && code === '1') {
        return !bullpenRole.find((b) => b.role === '선발투수')?.playerId && !uniquePositionsFilled.has('1');
      }
      return !uniquePositionsFilled.has(code);
    }
  );

  // Save preset to DB
  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      alert('프리셋 이름을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      const startingPitcherId =
        bullpenRole.find((b) => b.role === '선발투수')?.playerId ||
        lineup.find((s) => s.positionCode === '1')?.playerId ||
        null;

      if (selectedPresetId) {
        await api.updateRoster(team.id, selectedPresetId, {
          name: presetName.trim(),
          description: presetDesc.trim(),
          is_default: isDefault ? 1 : 0,
          dh_rule: dhRule ? 1 : 0,
          starting_pitcher_id: startingPitcherId,
          lineup,
          bullpen: bullpenRole,
          bench: benchPlayerIds,
        });
      } else {
        const created = await api.createRoster(team.id, {
          name: presetName.trim(),
          description: presetDesc.trim(),
          is_default: isDefault ? 1 : 0,
          dh_rule: dhRule ? 1 : 0,
          starting_pitcher_id: startingPitcherId,
          lineup,
          bullpen: bullpenRole,
          bench: benchPlayerIds,
        });
        setSelectedPresetId(created.id);
      }

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });

      setSaveSuccessMsg('로스터 프리셋이 성공적으로 저장되었습니다!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
      loadPresets();
      onRosterUpdated?.();
    } catch (err: any) {
      alert(err.message || '로스터 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete preset
  const handleDeletePreset = async () => {
    if (!selectedPresetId) return;
    if (!confirm('정말 이 프리셋을 삭제하시겠습니까?')) return;

    try {
      await api.deleteRoster(team.id, selectedPresetId);
      loadPresets();
      onRosterUpdated?.();
    } catch (err: any) {
      alert(err.message || '삭제 중 오류가 발생했습니다.');
    }
  };

  // Copy match-ready lineup text for sharing
  const handleCopyLineupText = () => {
    const lines = [
      `⚾ [${team.name}] 시합 라인업 프리셋: ${presetName}`,
      `규정: ${dhRule ? '지명타자(DH)제 적용' : '투수 타격제'}`,
      '---------------------------------',
      '【선발 타순 (Batting Order)】',
      ...lineup.map((slot) => {
        const posMeta = BASEBALL_POSITIONS[slot.positionCode];
        const player = players.find((p) => p.id === slot.playerId);
        const handInfo = player ? `(${player.throwing_hand}${player.batting_hand})` : '';
        return `${slot.battingOrder}번 [${slot.positionCode}:${posMeta?.abbr || slot.positionCode}] #${slot.backNumber || '-'} ${slot.playerName || '(미배정)'} ${handInfo}`;
      }),
      '---------------------------------',
      '【투수진 (Bullpen)】',
      ...bullpenRole.map((b) => {
        const p = players.find((x) => x.id === b.playerId);
        return `${b.role}: #${p?.back_number || '-'} ${p?.name || '미배정'}`;
      }),
      '---------------------------------',
      `생성일: ${new Date().toLocaleDateString('ko-KR')} | Dugout Pro`,
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Preset Selector Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                {team.name}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">· 등록 선수 {players.length}명</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              로스터 프리셋 빌더 (Roster Presets)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              야구 표준 수비코드(1~9번/DH)와 1~9번 타순을 구성하여 시합 전 즉시 불러오는 프리셋을 제작합니다.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={createNewEmptyPreset}
              className="px-3.5 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              새 프리셋 만들기
            </button>
            <button
              onClick={handleAutoFill}
              className="px-3.5 py-2 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600/40 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              title="등록된 선수의 주포지션을 감지하여 9개 수비 포지션에 자동 배정합니다"
            >
              <Wand2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              주포지션 자동배치
            </button>
            <button
              onClick={handleCopyLineupText}
              className="px-3.5 py-2 text-xs font-bold bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-600/40 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              {copyFeedback ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  복사 완료!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  라인업 텍스트 복사
                </>
              )}
            </button>
            <button
              onClick={handleSavePreset}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-black bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/30"
            >
              <Save className="w-4 h-4" />
              {selectedPresetId ? '프리셋 저장' : '새 프리셋 등록'}
            </button>
          </div>
        </div>

        {/* Existing Presets Pill Tabs */}
        {presets.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0 mr-1">저장된 프리셋:</span>
            {presets.map((p) => {
              const active = selectedPresetId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => loadPresetIntoState(p)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all shrink-0 flex items-center gap-1.5 border ${
                    active
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {p.is_default === 1 && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {saveSuccessMsg && (
        <div className="flex items-center gap-2 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/80 rounded-xl animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Preset Meta Edit Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl grid grid-cols-1 md:grid-cols-3 gap-4 transition-colors">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            프리셋 이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="예: 2026 주말리그 정규 선발 라인업"
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">설명 및 전술 노트</label>
          <input
            type="text"
            value={presetDesc}
            onChange={(e) => setPresetDesc(e.target.value)}
            placeholder="예: 발 빠른 1-2번과 장타력 중심 4-5번 배치"
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-4 pt-4 md:pt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dhRule}
              onChange={(e) => setDhRule(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300">
              지명타자(DH)제 적용 <span className="text-[10px] text-slate-500">(투수 타석 제외)</span>
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            />
            <span className="text-xs text-amber-600 dark:text-amber-300 flex items-center gap-1 font-semibold">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              기본 프리셋으로 지정
            </span>
          </label>

          {selectedPresetId && (
            <button
              onClick={handleDeletePreset}
              className="ml-auto p-2 text-red-500 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
              title="프리셋 삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Validation Status Badges */}
      {(missingDefensePositions.length > 0 || duplicatePlayerIds.length > 0) && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300 font-semibold">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              {missingDefensePositions.length > 0 && (
                <div className="leading-relaxed">
                  미배정 수비 포지션:{' '}
                  {missingDefensePositions.map((code) => (
                    <span key={code} className="inline-block mr-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold">
                      [{code}] {BASEBALL_POSITIONS[code]?.koreanName}
                    </span>
                  ))}
                </div>
              )}
              {duplicatePlayerIds.length > 0 && (
                <div className="text-red-600 dark:text-red-400 mt-0.5 font-bold">
                  ⚠️ 중복 배치된 선수가 있습니다 (동일 선수가 2개 이상 타순에 배치됨)
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleAutoFill}
            className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-all self-start md:self-auto shrink-0 shadow-sm"
          >
            자동 해결하기
          </button>
        </div>
      )}

      {/* Main Grid: Batting Order Table + Baseball Diamond Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 1~9 Batting Order Builder (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                선발 라인업 (1번 ~ 9번 타순)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">타순 순서와 각 선수의 수비 포지션 코드를 지정합니다.</p>
            </div>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
              9명 배정 완료: {lineup.filter((s) => s.playerId).length}/9
            </span>
          </div>

          {/* Batting Order List */}
          <div className="space-y-2.5">
            {lineup.map((slot, index) => {
              const roleMeta = BATTING_ROLES[slot.battingOrder];
              const isSelected = selectedPosition === slot.positionCode;
              const player = players.find((p) => p.id === slot.playerId);

              return (
                <div
                  key={index}
                  className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center gap-3 ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-slate-800/90 border-amber-400 ring-1 ring-amber-400'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Order Number & Up/Down Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/40 flex items-center justify-center font-black text-sm text-blue-700 dark:text-blue-300">
                      {slot.battingOrder}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveSlot(index, 'up')}
                        className="p-0.5 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 disabled:opacity-20"
                        title="위로 이동"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === lineup.length - 1}
                        onClick={() => moveSlot(index, 'down')}
                        className="p-0.5 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 disabled:opacity-20"
                        title="아래로 이동"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Player Select */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${roleMeta?.color || 'text-slate-500 dark:text-slate-400'}`}>
                        {roleMeta?.title.split(' ')[1] || '타자'}
                      </span>
                      {player && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {player.throwing_hand}{player.batting_hand} · 주:{player.primary_position}
                        </span>
                      )}
                    </div>
                    <select
                      value={slot.playerId}
                      onChange={(e) => updateSlotPlayer(index, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-blue-500 truncate"
                    >
                      <option value="">(선수 선택 없음)</option>
                      {players.map((p) => {
                        return (
                          <option key={p.id} value={p.id}>
                            #{p.back_number} {p.name} [{p.primary_position} {BASEBALL_POSITIONS[p.primary_position]?.abbr}] ({p.throwing_hand}{p.batting_hand})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Defensive Position Code Selector */}
                  <div className="sm:w-44 shrink-0">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">수비 포지션 코드</label>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center text-[11px] font-black shrink-0 ${getPositionBadgeColor(
                          slot.positionCode
                        )}`}
                      >
                        {slot.positionCode}
                      </div>
                      <select
                        value={slot.positionCode}
                        onChange={(e) => updateSlotPosition(index, e.target.value as BaseballPositionCode)}
                        className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
                      >
                        {POSITION_LIST.map((pos) => (
                          <option key={pos.code} value={pos.code}>
                            [{pos.code}] {pos.abbr} {pos.koreanName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bullpen & Rotation Section */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"></span>
              투수진 및 보직 (Bullpen Rotation)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {bullpenRole.map((item, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5">
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 block mb-1">{item.role}</span>
                  <select
                    value={item.playerId}
                    onChange={(e) => {
                      const updated = [...bullpenRole];
                      updated[idx].playerId = e.target.value;
                      setBullpenRole(updated);
                    }}
                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">(투수 선택)</option>
                    {players
                      .filter((p) => p.primary_position === '1' || p.secondary_position === '1' || true)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          #{p.back_number} {p.name} ({p.throwing_hand})
                        </option>
                      ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Interactive Baseball Diamond Visualizer (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="text-base">🏟️</span> 야구 다이아몬드 필드 배치도
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  포지션 노드를 클릭하면 해당 수비 위치와 선수를 확인할 수 있습니다.
                </p>
              </div>
            </div>

            <BaseballDiamond
              lineup={lineup}
              selectedPosition={selectedPosition}
              onSlotClick={(posCode) => {
                setSelectedPosition(selectedPosition === posCode ? null : posCode);
              }}
            />

            {/* Position Guide & Legend */}
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-xl">
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2 flex items-center justify-between">
                <span>야구 표준 수비 번호 체계 (Official Defensive Codes)</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">1~9번 규격</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[10px]">
                <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <span className="w-4 h-4 rounded bg-blue-600 text-white font-bold flex items-center justify-center text-[9px]">1</span>
                  <span>투수 (P)</span>
                </div>
                <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <span className="w-4 h-4 rounded bg-orange-600 text-white font-bold flex items-center justify-center text-[9px]">2</span>
                  <span>포수 (C)</span>
                </div>
                <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <span className="w-4 h-4 rounded bg-emerald-600 text-white font-bold flex items-center justify-center text-[9px]">3</span>
                  <span>1루수 (1B)</span>
                </div>
                <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <span className="w-4 h-4 rounded bg-emerald-600 text-white font-bold flex items-center justify-center text-[9px]">4</span>
                  <span>2루수 (2B)</span>
                </div>
                <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <span className="w-4 h-4 rounded bg-emerald-600 text-white font-bold flex items-center justify-center text-[9px]">5</span>
                  <span>3루수 (3B)</span>
                </div>
                <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <span className="w-4 h-4 rounded bg-emerald-600 text-white font-bold flex items-center justify-center text-[9px]">6</span>
                  <span>유격수 (SS)</span>
                </div>
                <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <span className="w-4 h-4 rounded bg-teal-600 text-white font-bold flex items-center justify-center text-[9px]">7</span>
                  <span>좌익수 (LF)</span>
                </div>
                <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <span className="w-4 h-4 rounded bg-teal-600 text-white font-bold flex items-center justify-center text-[9px]">8</span>
                  <span>중견수 (CF)</span>
                </div>
                <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <span className="w-4 h-4 rounded bg-teal-600 text-white font-bold flex items-center justify-center text-[9px]">9</span>
                  <span>우익수 (RF)</span>
                </div>
                <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <span className="w-4 h-4 rounded bg-purple-600 text-white font-bold flex items-center justify-center text-[9px]">DH</span>
                  <span>지명타자</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

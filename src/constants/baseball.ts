import { BaseballPositionCode, PositionMeta } from '../types';

export const BASEBALL_POSITIONS: Record<BaseballPositionCode, PositionMeta> = {
  '1': {
    code: '1',
    abbr: 'P',
    name: 'Pitcher',
    koreanName: '투수',
    category: 'PITCHER',
    desc: '마운드에서 투구를 담당하는 수비의 중심 (야구 규칙 공식 수비번호 1번)',
    fieldCoordinates: { x: 50, y: 62 },
  },
  '2': {
    code: '2',
    abbr: 'C',
    name: 'Catcher',
    koreanName: '포수',
    category: 'CATCHER',
    desc: '홈플레이트 뒤에서 투수의 공을 받고 그라운드를 지휘하는 안방마님 (수비번호 2번)',
    fieldCoordinates: { x: 50, y: 88 },
  },
  '3': {
    code: '3',
    abbr: '1B',
    name: 'First Baseman',
    koreanName: '1루수',
    category: 'INFIELD',
    desc: '1루 베이스를 지키며 내야 송구 포구 및 강습 타구 처리 (수비번호 3번)',
    fieldCoordinates: { x: 74, y: 55 },
  },
  '4': {
    code: '4',
    abbr: '2B',
    name: 'Second Baseman',
    koreanName: '2루수',
    category: 'INFIELD',
    desc: '2루와 1루 사이를 커버하며 더블플레이와 중계 플레이 담당 (수비번호 4번)',
    fieldCoordinates: { x: 62, y: 44 },
  },
  '5': {
    code: '5',
    abbr: '3B',
    name: 'Third Baseman',
    koreanName: '3루수',
    category: 'INFIELD',
    desc: '핫코너 3루 베이스를 수비하며 강한 어깨와 빠른 반사신경 요구 (수비번호 5번)',
    fieldCoordinates: { x: 26, y: 55 },
  },
  '6': {
    code: '6',
    abbr: 'SS',
    name: 'Shortstop',
    koreanName: '유격수',
    category: 'INFIELD',
    desc: '2루와 3루 사이 내야의 사령관, 가장 많은 타구를 처리하는 핵심 수비 (수비번호 6번)',
    fieldCoordinates: { x: 38, y: 44 },
  },
  '7': {
    code: '7',
    abbr: 'LF',
    name: 'Left Fielder',
    koreanName: '좌익수',
    category: 'OUTFIELD',
    desc: '외야 좌측을 수비하며 우타자의 강한 당겨친 타구 처리 (수비번호 7번)',
    fieldCoordinates: { x: 22, y: 24 },
  },
  '8': {
    code: '8',
    abbr: 'CF',
    name: 'Center Fielder',
    koreanName: '중견수',
    category: 'OUTFIELD',
    desc: '가장 넓은 외야 중앙을 커버하며 외야 수비의 지휘관 역할 (수비번호 8번)',
    fieldCoordinates: { x: 50, y: 16 },
  },
  '9': {
    code: '9',
    abbr: 'RF',
    name: 'Right Fielder',
    koreanName: '우익수',
    category: 'OUTFIELD',
    desc: '외야 우측을 수비하며 3루 송구를 위한 강력한 어깨가 필수 (수비번호 9번)',
    fieldCoordinates: { x: 78, y: 24 },
  },
  'DH': {
    code: 'DH',
    abbr: 'DH',
    name: 'Designated Hitter',
    koreanName: '지명타자',
    category: 'DH',
    desc: '수비에는 참가하지 않고 투수를 대신하여 타석에 전담하는 전문 타자',
    fieldCoordinates: { x: 88, y: 88 },
  },
};

export const POSITION_LIST: PositionMeta[] = [
  BASEBALL_POSITIONS['1'],
  BASEBALL_POSITIONS['2'],
  BASEBALL_POSITIONS['3'],
  BASEBALL_POSITIONS['4'],
  BASEBALL_POSITIONS['5'],
  BASEBALL_POSITIONS['6'],
  BASEBALL_POSITIONS['7'],
  BASEBALL_POSITIONS['8'],
  BASEBALL_POSITIONS['9'],
  BASEBALL_POSITIONS['DH'],
];

export const BATTING_ROLES: Record<number, { title: string; desc: string; color: string }> = {
  1: { title: '1번 타자 (테이블세터)', desc: '높은 출루율과 빠른 주력으로 찬스를 메이킹하는 리드오프', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  2: { title: '2번 타자 (테이블세터)', desc: '작전수행능력, 번트, 진루타 및 강한 2번 타자 트렌드', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  3: { title: '3번 타자 (클린업)', desc: '정확도와 장타력을 겸비한 팀 내 최고 타율의 핵심 해결사', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  4: { title: '4번 타자 (클린업)', desc: '팀을 대표하는 홈런포와 클러치 능력을 갖춘 거포 타자', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  5: { title: '5번 타자 (클린업)', desc: '4번 타자 뒷받침 및 득점권 찬스를 해결하는 묵직한 타격', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  6: { title: '6번 타자 (하위타선)', desc: '제2의 클린업 트리오 시작점 및 득점 지원', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  7: { title: '7번 타자 (하위타선)', desc: '하위타선 연결고리 및 기습 장타', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  8: { title: '8번 타자 (하위타선)', desc: '수비 중시 포수 또는 작전 타자 배치', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  9: { title: '9번 타자 (하위타선)', desc: '상위타선으로 연결하는 제2의 리드오프 (상위 타선 연결)', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
};

export function getPositionBadgeColor(code: BaseballPositionCode): string {
  switch (code) {
    case '1':
      return 'bg-blue-600 text-white border-blue-400';
    case '2':
      return 'bg-orange-600 text-white border-orange-400';
    case '3':
    case '4':
    case '5':
    case '6':
      return 'bg-emerald-600 text-white border-emerald-400';
    case '7':
    case '8':
    case '9':
      return 'bg-teal-600 text-white border-teal-400';
    case 'DH':
      return 'bg-purple-600 text-white border-purple-400';
    default:
      return 'bg-slate-700 text-slate-200 border-slate-600';
  }
}

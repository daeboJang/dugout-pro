// Baseball standard position code
export type BaseballPositionCode = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'DH';

export interface PositionMeta {
  code: BaseballPositionCode;
  abbr: string;
  name: string;
  koreanName: string;
  category: 'PITCHER' | 'CATCHER' | 'INFIELD' | 'OUTFIELD' | 'DH';
  desc: string;
  fieldCoordinates: { x: number; y: number }; // percentage for baseball diamond
}

export type MemberRole = 'ADMIN' | 'MASTER' | 'USER';
export type MemberStatus = 'ACTIVE' | 'INACTIVE';
export type TeamStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PlayerStatus = 'ACTIVE' | 'INJURED' | 'REST';

export interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: MemberRole;
  team_id?: string | null;
  nickname?: string;
  avatar_color?: string;
  status: MemberStatus;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  emblem_icon?: string;
  color?: string;
  city: string;
  foundation_year?: number;
  description?: string;
  master_id: string;
  master_name: string;
  status: TeamStatus;
  request_reason?: string;
  admin_notes?: string;
  created_at: string;
  approved_at?: string | null;
  player_count?: number;
  roster_count?: number;
}

export interface Player {
  id: string;
  team_id: string;
  name: string;
  back_number: number;
  primary_position: BaseballPositionCode;
  secondary_position?: BaseballPositionCode | null;
  batting_hand: '우타' | '좌타' | '양타';
  throwing_hand: '우투' | '좌투';
  birthdate?: string | null;
  status: PlayerStatus;
  notes?: string;
  created_at: string;
}

export interface LineupSlot {
  battingOrder: number; // 1 ~ 9 (or 10)
  playerId: string;
  playerName: string;
  backNumber: number;
  positionCode: BaseballPositionCode;
  positionName: string;
  role?: string; // e.g. 테이블세터, 클린업트리오, 하위타선
}

export interface BullpenSlot {
  role: string; // 선발, 셋업, 마무리, 롱릴리프
  playerId: string;
  playerName: string;
  backNumber: number;
  positionCode: string;
}

export interface BenchSlot {
  role: string; // 대타, 대주자, 백업포수, 백업내야, 백업외야
  playerId: string;
  playerName: string;
  backNumber: number;
  positionCode: string;
}

export interface RosterPreset {
  id: string;
  team_id: string;
  name: string;
  is_default: number; // 1 or 0
  dh_rule: number; // 1 or 0
  starting_pitcher_id?: string | null;
  lineup_json: string;
  bullpen_json?: string;
  bench_json?: string;
  description?: string;
  updated_at: string;
  created_at: string;
}

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path in project root
const dbPath = path.resolve(__dirname, '../../dugout_pro.sqlite');
export const db = new Database(dbPath);

// Enable foreign keys and WAL mode for reliability
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    -- 회원 (Members) 테이블
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'MASTER', 'USER')),
      team_id TEXT,
      nickname TEXT,
      avatar_color TEXT DEFAULT '#3b82f6',
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
      created_at TEXT NOT NULL
    );

    -- 팀 (Teams) 테이블
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emblem_icon TEXT DEFAULT 'baseball',
      color TEXT DEFAULT '#2563eb',
      city TEXT NOT NULL,
      foundation_year INTEGER,
      description TEXT,
      master_id TEXT NOT NULL,
      master_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
      request_reason TEXT,
      admin_notes TEXT,
      created_at TEXT NOT NULL,
      approved_at TEXT,
      FOREIGN KEY(master_id) REFERENCES members(id) ON DELETE RESTRICT
    );

    -- 선수 (Players) 테이블
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      name TEXT NOT NULL,
      back_number INTEGER NOT NULL,
      primary_position TEXT NOT NULL,
      secondary_position TEXT,
      batting_hand TEXT NOT NULL DEFAULT '우타',
      throwing_hand TEXT NOT NULL DEFAULT '우투',
      birthdate TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INJURED', 'REST')),
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE,
      UNIQUE(team_id, back_number)
    );

    -- 프리셋 로스터 (Roster Presets) 테이블
    CREATE TABLE IF NOT EXISTS rosters (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      name TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      dh_rule INTEGER DEFAULT 1,
      starting_pitcher_id TEXT,
      lineup_json TEXT NOT NULL,
      bullpen_json TEXT,
      bench_json TEXT,
      description TEXT,
      updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    -- 시합 (Matches) 스키마 정의 (엔티티 명세용)
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      home_team_id TEXT NOT NULL,
      away_team_id TEXT NOT NULL,
      match_date TEXT NOT NULL,
      stadium TEXT,
      home_roster_id TEXT,
      away_roster_id TEXT,
      status TEXT DEFAULT 'SCHEDULED',
      created_at TEXT NOT NULL
    );

    -- 기록 (Records) 스키마 정의 (엔티티 명세용)
    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      inning INTEGER,
      record_code TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Seed default data if empty
  seedInitialData();
}

export function seedInitialData() {
  const memberCount = (db.prepare('SELECT count(*) as count FROM members').get() as { count: number }).count;
  if (memberCount > 0) return;

  const now = new Date().toISOString();

  // 1. Members
  const insertMember = db.prepare(`
    INSERT INTO members (id, name, email, phone, role, team_id, nickname, avatar_color, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertMember.run('mem_admin', '김총괄', 'admin@dugout.pro', '010-1234-5678', 'ADMIN', null, '운영위원장', '#dc2626', 'ACTIVE', now);
  insertMember.run('mem_master_1', '이승엽', 'master.lee@seouldragons.com', '010-9876-5432', 'MASTER', 'team_dragons', '국민타자마스터', '#2563eb', 'ACTIVE', now);
  insertMember.run('mem_master_2', '박찬호', 'master.park@busanmarines.kr', '010-3333-7777', 'MASTER', 'team_marines', '코리안특급마스터', '#0d9488', 'ACTIVE', now);
  insertMember.run('mem_user_applicant', '박희망', 'hope.park@incheontitans.club', '010-5555-8888', 'USER', 'team_titans_pending', '타이탄스신청자', '#ea580c', 'ACTIVE', now);
  insertMember.run('mem_user_new', '최신규', 'newbie.choi@gmail.com', '010-7777-9999', 'USER', null, '야구열정남', '#8b5cf6', 'ACTIVE', now);

  // 2. Teams
  const insertTeam = db.prepare(`
    INSERT INTO teams (id, name, emblem_icon, color, city, foundation_year, description, master_id, master_name, status, request_reason, admin_notes, created_at, approved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Approved Team 1
  insertTeam.run(
    'team_dragons',
    '서울 블루드래곤즈',
    'shield',
    '#2563eb',
    '서울특별시 송파구',
    2021,
    '주말 탄천리그 1부 소속, 매주 토요일 정기 훈련 및 사회인 리그 참가를 목적으로 하는 매너 야구단입니다.',
    'mem_master_1',
    '이승엽',
    'APPROVED',
    '서울 동남권 사회인 야구 동호인들의 체계적인 리그 활동 및 유소년 야구 후원',
    '구장 확보 및 인원 요건 충족하여 승인 완료',
    now,
    now
  );

  // Approved Team 2
  insertTeam.run(
    'team_marines',
    '부산 마린스',
    'anchor',
    '#0d9488',
    '부산광역시 해운대구',
    2023,
    '부산 삼락생태공원 야구장 홈그라운드, 3040 직장인 열정 야구단입니다.',
    'mem_master_2',
    '박찬호',
    'APPROVED',
    '부산 권역 직장인 친선 리그 참가 및 주말 체육 활성화',
    '협회 규정 준수 서약 확인 완료',
    now,
    now
  );

  // Pending Team (waiting for Admin approval)
  insertTeam.run(
    'team_titans_pending',
    '인천 타이탄스',
    'flame',
    '#ea580c',
    '인천광역시 연수구 송도동',
    2026,
    '송도 LNG 야구장 주경기장 사용 예정이며, 신규 청년 야구 동호인 20명이 모여 창단을 준비하고 있습니다.',
    'mem_user_applicant',
    '박희망',
    'PENDING',
    '인천 연수구/송도 지역 사회인 야구 저변 확대 및 신규 주말 아마추어 리그 참가',
    null,
    now,
    null
  );

  // 3. Players for Team Dragons
  const insertPlayer = db.prepare(`
    INSERT INTO players (id, team_id, name, back_number, primary_position, secondary_position, batting_hand, throwing_hand, birthdate, status, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const dragonsPlayers = [
    { id: 'PLY-SBD-001', name: '김선발', num: 1, pos: '1', sub: 'DH', bat: '우타', thr: '우투', note: '에이스 투수, 직구 최고 125km' },
    { id: 'PLY-SBD-002', name: '강포수', num: 25, pos: '2', sub: '3', bat: '우타', thr: '우투', note: '주전 포수, 안정적인 블로킹과 도루저지율 우수' },
    { id: 'PLY-SBD-003', name: '이승엽(마스터)', num: 36, pos: '3', sub: 'DH', bat: '좌타', thr: '좌투', note: '팀 마스터 겸 4번 타자, 통산 홈런 1위' },
    { id: 'PLY-SBD-004', name: '정2루', num: 4, pos: '4', sub: '6', bat: '우타', thr: '우투', note: '작전수행능력 최상, 번트 전문가' },
    { id: 'PLY-SBD-005', name: '최3루', num: 14, pos: '5', sub: '1', bat: '우타', thr: '우투', note: '핫코너 철벽수비 및 장타력 보유' },
    { id: 'PLY-SBD-006', name: '박유격', num: 7, pos: '6', sub: '4', bat: '우타', thr: '우투', note: '내야 사령관, 넓은 수비 범위' },
    { id: 'PLY-SBD-007', name: '한좌익', num: 53, pos: '7', sub: 'DH', bat: '좌타', thr: '우투', note: '테이블세터, 1번 타자 출루머신' },
    { id: 'PLY-SBD-008', name: '송중견', num: 17, pos: '8', sub: '9', bat: '우타', thr: '우투', note: '외야 수비의 핵심, 빠른 주력과 레이저 송구' },
    { id: 'PLY-SBD-009', name: '윤우익', num: 31, pos: '9', sub: '7', bat: '좌타', thr: '우투', note: '강한 어깨, 우익선상 수비 안정' },
    { id: 'PLY-SBD-010', name: '오마무리', num: 21, pos: '1', sub: 'DH', bat: '우타', thr: '우투', note: '돌직구 클로저, 9회 전문 마무리 투수' },
    { id: 'PLY-SBD-011', name: '배지명', num: 33, pos: 'DH', sub: '3', bat: '우타', thr: '우투', note: '전문 지명타자, 찬스에 강한 승부사' },
    { id: 'PLY-SBD-012', name: '신백업', num: 9, pos: '6', sub: '4', bat: '양타', thr: '우투', note: '스위치히터 내야 유틸리티 자원' },
    { id: 'PLY-SBD-013', name: '조불펜', num: 41, pos: '1', sub: '8', bat: '좌타', thr: '좌투', note: '좌완 셋업맨, 슬라이더 주무기' },
    { id: 'PLY-SBD-014', name: '임대주', num: 8, pos: '8', sub: '7', bat: '우타', thr: '우투', note: '대주자 및 경기 후반 대수비 전담' },
  ];

  for (const p of dragonsPlayers) {
    insertPlayer.run(p.id, 'team_dragons', p.name, p.num, p.pos, p.sub, p.bat, p.thr, '1992-05-15', 'ACTIVE', p.note, now);
  }

  // 4. Default Roster for Team Dragons
  const insertRoster = db.prepare(`
    INSERT INTO rosters (id, team_id, name, is_default, dh_rule, starting_pitcher_id, lineup_json, bullpen_json, bench_json, description, updated_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const dragonsLineup = [
    { battingOrder: 1, playerId: 'PLY-SBD-007', playerName: '한좌익', backNumber: 53, positionCode: '7', positionName: '좌익수', role: '테이블세터' },
    { battingOrder: 2, playerId: 'PLY-SBD-004', playerName: '정2루', backNumber: 4, positionCode: '4', positionName: '2루수', role: '테이블세터' },
    { battingOrder: 3, playerId: 'PLY-SBD-008', playerName: '송중견', backNumber: 17, positionCode: '8', positionName: '중견수', role: '클린업트리오' },
    { battingOrder: 4, playerId: 'PLY-SBD-003', playerName: '이승엽(마스터)', backNumber: 36, positionCode: '3', positionName: '1루수', role: '클린업트리오' },
    { battingOrder: 5, playerId: 'PLY-SBD-011', playerName: '배지명', backNumber: 33, positionCode: 'DH', positionName: '지명타자', role: '클린업트리오' },
    { battingOrder: 6, playerId: 'PLY-SBD-005', playerName: '최3루', backNumber: 14, positionCode: '5', positionName: '3루수', role: '하위타선' },
    { battingOrder: 7, playerId: 'PLY-SBD-002', playerName: '강포수', backNumber: 25, positionCode: '2', positionName: '포수', role: '하위타선' },
    { battingOrder: 8, playerId: 'PLY-SBD-006', playerName: '박유격', backNumber: 7, positionCode: '6', positionName: '유격수', role: '하위타선' },
    { battingOrder: 9, playerId: 'PLY-SBD-009', playerName: '윤우익', backNumber: 31, positionCode: '9', positionName: '우익수', role: '하위타선' },
  ];

  const dragonsBullpen = [
    { role: '선발', playerId: 'PLY-SBD-001', playerName: '김선발', backNumber: 1, positionCode: '1' },
    { role: '셋업', playerId: 'PLY-SBD-013', playerName: '조불펜', backNumber: 41, positionCode: '1' },
    { role: '마무리', playerId: 'PLY-SBD-010', playerName: '오마무리', backNumber: 21, positionCode: '1' },
  ];

  const dragonsBench = [
    { role: '백업 내야', playerId: 'PLY-SBD-012', playerName: '신백업', backNumber: 9, positionCode: '6' },
    { role: '대주자/대수비', playerId: 'PLY-SBD-014', playerName: '임대주', backNumber: 8, positionCode: '8' },
  ];

  insertRoster.run(
    'roster_sbd_default',
    'team_dragons',
    '2026 주말 정규리그 선발 라인업 (지명타자제)',
    1,
    1,
    'PLY-SBD-001',
    JSON.stringify(dragonsLineup),
    JSON.stringify(dragonsBullpen),
    JSON.stringify(dragonsBench),
    '정규 리그 공식 주전 베스트9 및 승리조 불펜 구성',
    now,
    now
  );
}

// Helper query functions
export function getMembers() {
  return db.prepare('SELECT * FROM members ORDER BY created_at DESC').all();
}

export function getTeams() {
  return db.prepare(`
    SELECT t.*, 
      (SELECT COUNT(*) FROM players WHERE team_id = t.id) as player_count,
      (SELECT COUNT(*) FROM rosters WHERE team_id = t.id) as roster_count
    FROM teams t 
    ORDER BY 
      CASE t.status WHEN 'PENDING' THEN 1 WHEN 'APPROVED' THEN 2 ELSE 3 END,
      t.created_at DESC
  `).all();
}

export function getPlayersByTeam(teamId: string) {
  return db.prepare('SELECT * FROM players WHERE team_id = ? ORDER BY back_number ASC').all(teamId);
}

export function getRostersByTeam(teamId: string) {
  return db.prepare('SELECT * FROM rosters WHERE team_id = ? ORDER BY is_default DESC, created_at DESC').all(teamId);
}

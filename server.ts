import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db, initDatabase, getMembers, getTeams, getPlayersByTeam, getRostersByTeam } from './src/server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB schema & seed data
initDatabase();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // --- API Endpoints ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 1. Members API
  app.get('/api/members', (req, res) => {
    try {
      const members = getMembers();
      res.json(members);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/members', (req, res) => {
    try {
      const { name, email, phone, role = 'USER', nickname } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: '이름과 이메일은 필수 입력값입니다.' });
      }

      const id = `mem_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
      const avatar_color = colors[Math.floor(Math.random() * colors.length)];
      const created_at = new Date().toISOString();

      db.prepare(`
        INSERT INTO members (id, name, email, phone, role, team_id, nickname, avatar_color, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
      `).run(id, name, email, phone || '', role, null, nickname || name, avatar_color, created_at);

      const created = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/members/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { role, nickname, phone, status, team_id } = req.body;

      const current = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as any;
      if (!current) {
        return res.status(404).json({ error: '회원을 찾을 수 없습니다.' });
      }

      db.prepare(`
        UPDATE members 
        SET role = COALESCE(?, role),
            nickname = COALESCE(?, nickname),
            phone = COALESCE(?, phone),
            status = COALESCE(?, status),
            team_id = CASE WHEN ? = 'NULL_VALUE' THEN NULL WHEN ? IS NOT NULL THEN ? ELSE team_id END
        WHERE id = ?
      `).run(
        role ?? null,
        nickname ?? null,
        phone ?? null,
        status ?? null,
        team_id === null ? 'NULL_VALUE' : 'KEEP',
        team_id ?? null,
        team_id ?? null,
        id
      );

      const updated = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Teams API
  app.get('/api/teams', (req, res) => {
    try {
      const teams = getTeams();
      res.json(teams);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/teams/:id', (req, res) => {
    try {
      const { id } = req.params;
      const team = db.prepare(`
        SELECT t.*, 
          (SELECT COUNT(*) FROM players WHERE team_id = t.id) as player_count,
          (SELECT COUNT(*) FROM rosters WHERE team_id = t.id) as roster_count
        FROM teams t 
        WHERE t.id = ?
      `).get(id);
      if (!team) return res.status(404).json({ error: '팀을 찾을 수 없습니다.' });
      res.json(team);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 회원이 팀 생성 신청
  app.post('/api/teams', (req, res) => {
    try {
      const { name, city, foundation_year, description, master_id, master_name, emblem_icon, color, request_reason } = req.body;
      if (!name || !city || !master_id || !master_name) {
        return res.status(400).json({ error: '팀명, 연고지, 신청자 정보는 필수 항목입니다.' });
      }

      // Check if team name already exists
      const existingTeam = db.prepare('SELECT id FROM teams WHERE name = ?').get(name);
      if (existingTeam) {
        return res.status(400).json({ error: '이미 동일한 팀명의 팀이 등록되어 있습니다.' });
      }

      const teamId = `team_${Date.now()}`;
      const created_at = new Date().toISOString();

      db.prepare(`
        INSERT INTO teams (id, name, emblem_icon, color, city, foundation_year, description, master_id, master_name, status, request_reason, admin_notes, created_at, approved_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, null, ?, null)
      `).run(
        teamId,
        name,
        emblem_icon || 'baseball',
        color || '#2563eb',
        city,
        foundation_year ? parseInt(foundation_year, 10) : new Date().getFullYear(),
        description || '',
        master_id,
        master_name,
        request_reason || '아마추어 야구팀 창단 및 리그 참가',
        created_at
      );

      // Temporarily link user to the pending team
      db.prepare('UPDATE members SET team_id = ? WHERE id = ?').run(teamId, master_id);

      const created = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 관리자가 팀 승인 또는 반려 처리
  app.patch('/api/teams/:id/status', (req, res) => {
    try {
      const { id } = req.params;
      const { status, admin_notes } = req.body; // status: 'APPROVED' | 'REJECTED'

      if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
        return res.status(400).json({ error: '유효하지 않은 상태값입니다. (APPROVED, REJECTED, PENDING)' });
      }

      const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(id) as any;
      if (!team) return res.status(404).json({ error: '팀을 찾을 수 없습니다.' });

      const approved_at = status === 'APPROVED' ? new Date().toISOString() : null;

      db.prepare(`
        UPDATE teams 
        SET status = ?,
            admin_notes = COALESCE(?, admin_notes),
            approved_at = ?
        WHERE id = ?
      `).run(status, admin_notes ?? null, approved_at, id);

      // 팀생성을 요청한 회원이 팀 마스터가 된다!
      if (status === 'APPROVED') {
        db.prepare(`
          UPDATE members 
          SET role = 'MASTER',
              team_id = ?
          WHERE id = ?
        `).run(id, team.master_id);
      } else if (status === 'REJECTED') {
        // If rejected, keep role as USER
        db.prepare(`
          UPDATE members 
          SET role = 'USER'
          WHERE id = ? AND role != 'ADMIN'
        `).run(team.master_id);
      }

      const updated = db.prepare(`
        SELECT t.*, 
          (SELECT COUNT(*) FROM players WHERE team_id = t.id) as player_count,
          (SELECT COUNT(*) FROM rosters WHERE team_id = t.id) as roster_count
        FROM teams t 
        WHERE t.id = ?
      `).get(id);

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 팀 기본정보 수정 (팀 마스터/관리자)
  app.patch('/api/teams/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { name, city, foundation_year, description, emblem_icon, color } = req.body;

      db.prepare(`
        UPDATE teams 
        SET name = COALESCE(?, name),
            city = COALESCE(?, city),
            foundation_year = COALESCE(?, foundation_year),
            description = COALESCE(?, description),
            emblem_icon = COALESCE(?, emblem_icon),
            color = COALESCE(?, color)
        WHERE id = ?
      `).run(
        name ?? null,
        city ?? null,
        foundation_year ? parseInt(foundation_year, 10) : null,
        description ?? null,
        emblem_icon ?? null,
        color ?? null,
        id
      );

      const updated = db.prepare('SELECT * FROM teams WHERE id = ?').get(id);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Players API (선수 등록 및 관리)
  app.get('/api/teams/:id/players', (req, res) => {
    try {
      const { id } = req.params;
      const players = getPlayersByTeam(id);
      res.json(players);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 선수 등록: 고유번호(자동생성), 이름, 등번호, 주포지션 등
  app.post('/api/teams/:id/players', (req, res) => {
    try {
      const { id: teamId } = req.params;
      const { name, back_number, primary_position, secondary_position, batting_hand = '우타', throwing_hand = '우투', birthdate, notes, custom_id } = req.body;

      if (!name || back_number === undefined || !primary_position) {
        return res.status(400).json({ error: '선수 이름, 등번호, 주포지션은 필수 입력 항목입니다.' });
      }

      // Check duplicate uniform number within team
      const existingNumber = db.prepare('SELECT id, name FROM players WHERE team_id = ? AND back_number = ?').get(teamId, back_number) as any;
      if (existingNumber) {
        return res.status(400).json({ error: `등번호 ${back_number}번은 이미 [${existingNumber.name}] 선수가 사용 중입니다.` });
      }

      // Generate unique player code: e.g. PLY-YEAR-XXXX
      const team = db.prepare('SELECT name FROM teams WHERE id = ?').get(teamId) as any;
      const teamPrefix = team?.name ? team.name.slice(0, 2).toUpperCase() : 'TM';
      const count = (db.prepare('SELECT COUNT(*) as count FROM players WHERE team_id = ?').get(teamId) as any).count;
      const sequence = String(count + 1).padStart(3, '0');
      const generatedId = custom_id || `PLY-${teamPrefix}-${sequence}-${Math.floor(100 + Math.random() * 900)}`;

      const created_at = new Date().toISOString();

      db.prepare(`
        INSERT INTO players (id, team_id, name, back_number, primary_position, secondary_position, batting_hand, throwing_hand, birthdate, status, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
      `).run(
        generatedId,
        teamId,
        name,
        parseInt(back_number, 10),
        primary_position,
        secondary_position || null,
        batting_hand,
        throwing_hand,
        birthdate || null,
        notes || '',
        created_at
      );

      const created = db.prepare('SELECT * FROM players WHERE id = ?').get(generatedId);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 선수 수정
  app.patch('/api/teams/:id/players/:playerId', (req, res) => {
    try {
      const { id: teamId, playerId } = req.params;
      const { name, back_number, primary_position, secondary_position, batting_hand, throwing_hand, birthdate, status, notes } = req.body;

      if (back_number !== undefined) {
        const existingNumber = db.prepare('SELECT id, name FROM players WHERE team_id = ? AND back_number = ? AND id != ?').get(teamId, back_number, playerId) as any;
        if (existingNumber) {
          return res.status(400).json({ error: `등번호 ${back_number}번은 이미 [${existingNumber.name}] 선수가 사용 중입니다.` });
        }
      }

      db.prepare(`
        UPDATE players
        SET name = COALESCE(?, name),
            back_number = COALESCE(?, back_number),
            primary_position = COALESCE(?, primary_position),
            secondary_position = COALESCE(?, secondary_position),
            batting_hand = COALESCE(?, batting_hand),
            throwing_hand = COALESCE(?, throwing_hand),
            birthdate = COALESCE(?, birthdate),
            status = COALESCE(?, status),
            notes = COALESCE(?, notes)
        WHERE id = ? AND team_id = ?
      `).run(
        name ?? null,
        back_number !== undefined ? parseInt(back_number, 10) : null,
        primary_position ?? null,
        secondary_position ?? null,
        batting_hand ?? null,
        throwing_hand ?? null,
        birthdate ?? null,
        status ?? null,
        notes ?? null,
        playerId,
        teamId
      );

      const updated = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 선수 삭제
  app.delete('/api/teams/:id/players/:playerId', (req, res) => {
    try {
      const { id: teamId, playerId } = req.params;
      db.prepare('DELETE FROM players WHERE id = ? AND team_id = ?').run(playerId, teamId);
      res.json({ success: true, message: '선수가 성공적으로 등록 해제되었습니다.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 선수 일괄 생성 (테스트 샘플 자동 추가)
  app.post('/api/teams/:id/players/batch', (req, res) => {
    try {
      const { id: teamId } = req.params;
      const team = db.prepare('SELECT name FROM teams WHERE id = ?').get(teamId) as any;
      if (!team) return res.status(404).json({ error: '팀을 찾을 수 없습니다.' });

      const sampleNames = ['송진우', '양준혁', '이종범', '정민태', '홍성흔', '김동주', '박재홍', '임창용'];
      const positions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'DH'];
      const bats = ['우타', '좌타', '양타'];
      const throws = ['우투', '좌투'];

      // Find unused uniform numbers
      const usedNumbers = (db.prepare('SELECT back_number FROM players WHERE team_id = ?').all(teamId) as any[]).map(r => r.back_number);
      const candidates = [];

      for (let n = 1; n <= 99; n++) {
        if (!usedNumbers.includes(n)) {
          candidates.push(n);
        }
      }

      const inserted = [];
      const now = new Date().toISOString();

      for (let i = 0; i < Math.min(5, candidates.length); i++) {
        const backNum = candidates[i];
        const name = `${sampleNames[i % sampleNames.length]}_${backNum}`;
        const pos = positions[i % positions.length];
        const pid = `PLY-${team.name.slice(0, 2).toUpperCase()}-${String(backNum).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;

        db.prepare(`
          INSERT INTO players (id, team_id, name, back_number, primary_position, secondary_position, batting_hand, throwing_hand, birthdate, status, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
        `).run(
          pid,
          teamId,
          name,
          backNum,
          pos,
          pos === '1' ? 'DH' : '1',
          bats[i % bats.length],
          throws[i % throws.length],
          '1995-04-10',
          '자동 샘플 등록 선수',
          now
        );

        inserted.push(db.prepare('SELECT * FROM players WHERE id = ?').get(pid));
      }

      res.status(201).json({ count: inserted.length, players: inserted });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Rosters API (팀 마스터 로스터 프리셋 구성)
  app.get('/api/teams/:id/rosters', (req, res) => {
    try {
      const { id } = req.params;
      const rosters = getRostersByTeam(id);
      res.json(rosters);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/teams/:id/rosters', (req, res) => {
    try {
      const { id: teamId } = req.params;
      const { name, is_default = 0, dh_rule = 1, starting_pitcher_id, lineup, bullpen, bench, description } = req.body;

      if (!name || !lineup || !Array.isArray(lineup)) {
        return res.status(400).json({ error: '프리셋 이름과 라인업 목록은 필수입니다.' });
      }

      const rosterId = `roster_${Date.now()}`;
      const now = new Date().toISOString();

      if (is_default) {
        db.prepare('UPDATE rosters SET is_default = 0 WHERE team_id = ?').run(teamId);
      }

      db.prepare(`
        INSERT INTO rosters (id, team_id, name, is_default, dh_rule, starting_pitcher_id, lineup_json, bullpen_json, bench_json, description, updated_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        rosterId,
        teamId,
        name,
        is_default ? 1 : 0,
        dh_rule ? 1 : 0,
        starting_pitcher_id || null,
        JSON.stringify(lineup),
        JSON.stringify(bullpen || []),
        JSON.stringify(bench || []),
        description || '',
        now,
        now
      );

      const created = db.prepare('SELECT * FROM rosters WHERE id = ?').get(rosterId);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/teams/:id/rosters/:rosterId', (req, res) => {
    try {
      const { id: teamId, rosterId } = req.params;
      const { name, is_default, dh_rule, starting_pitcher_id, lineup, bullpen, bench, description } = req.body;

      if (is_default) {
        db.prepare('UPDATE rosters SET is_default = 0 WHERE team_id = ?').run(teamId);
      }

      const now = new Date().toISOString();

      db.prepare(`
        UPDATE rosters
        SET name = COALESCE(?, name),
            is_default = COALESCE(?, is_default),
            dh_rule = COALESCE(?, dh_rule),
            starting_pitcher_id = COALESCE(?, starting_pitcher_id),
            lineup_json = CASE WHEN ? IS NOT NULL THEN ? ELSE lineup_json END,
            bullpen_json = CASE WHEN ? IS NOT NULL THEN ? ELSE bullpen_json END,
            bench_json = CASE WHEN ? IS NOT NULL THEN ? ELSE bench_json END,
            description = COALESCE(?, description),
            updated_at = ?
        WHERE id = ? AND team_id = ?
      `).run(
        name ?? null,
        is_default !== undefined ? (is_default ? 1 : 0) : null,
        dh_rule !== undefined ? (dh_rule ? 1 : 0) : null,
        starting_pitcher_id ?? null,
        lineup ? 'UPDATE' : null,
        lineup ? JSON.stringify(lineup) : null,
        bullpen ? 'UPDATE' : null,
        bullpen ? JSON.stringify(bullpen) : null,
        bench ? 'UPDATE' : null,
        bench ? JSON.stringify(bench) : null,
        description ?? null,
        now,
        rosterId,
        teamId
      );

      const updated = db.prepare('SELECT * FROM rosters WHERE id = ?').get(rosterId);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/teams/:id/rosters/:rosterId', (req, res) => {
    try {
      const { id: teamId, rosterId } = req.params;
      db.prepare('DELETE FROM rosters WHERE id = ? AND team_id = ?').run(rosterId, teamId);
      res.json({ success: true, message: '로스터 프리셋이 삭제되었습니다.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Database Reset Endpoint
  app.post('/api/reset-db', (req, res) => {
    try {
      db.exec(`
        DROP TABLE IF EXISTS records;
        DROP TABLE IF EXISTS matches;
        DROP TABLE IF EXISTS rosters;
        DROP TABLE IF EXISTS players;
        DROP TABLE IF EXISTS teams;
        DROP TABLE IF EXISTS members;
      `);
      initDatabase();
      res.json({ success: true, message: '데이터베이스가 초기화되고 데모 데이터가 재생성되었습니다.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Vite & Static Asset Handling ---
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dugout Pro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

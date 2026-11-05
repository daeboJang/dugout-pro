import { Member, Team, Player, RosterPreset } from '../types';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `서버 오류 발생 (${res.status})`);
  }
  return res.json();
}

export const api = {
  // Members
  async getMembers(): Promise<Member[]> {
    const res = await fetch('/api/members');
    return handleResponse<Member[]>(res);
  },

  async createMember(data: { name: string; email: string; phone?: string; role?: string; nickname?: string }): Promise<Member> {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Member>(res);
  },

  async updateMember(id: string, data: Partial<Member>): Promise<Member> {
    const res = await fetch(`/api/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Member>(res);
  },

  // Teams
  async getTeams(): Promise<Team[]> {
    const res = await fetch('/api/teams');
    return handleResponse<Team[]>(res);
  },

  async getTeam(id: string): Promise<Team> {
    const res = await fetch(`/api/teams/${id}`);
    return handleResponse<Team>(res);
  },

  async requestTeamCreation(data: {
    name: string;
    city: string;
    foundation_year?: number;
    description?: string;
    master_id: string;
    master_name: string;
    emblem_icon?: string;
    color?: string;
    request_reason?: string;
  }): Promise<Team> {
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Team>(res);
  },

  async updateTeamStatus(teamId: string, status: 'APPROVED' | 'REJECTED' | 'PENDING', adminNotes?: string): Promise<Team> {
    const res = await fetch(`/api/teams/${teamId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_notes: adminNotes }),
    });
    return handleResponse<Team>(res);
  },

  async updateTeam(teamId: string, data: Partial<Team>): Promise<Team> {
    const res = await fetch(`/api/teams/${teamId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Team>(res);
  },

  // Players
  async getPlayers(teamId: string): Promise<Player[]> {
    const res = await fetch(`/api/teams/${teamId}/players`);
    return handleResponse<Player[]>(res);
  },

  async registerPlayer(teamId: string, data: {
    name: string;
    back_number: number;
    primary_position: string;
    secondary_position?: string;
    batting_hand?: string;
    throwing_hand?: string;
    birthdate?: string;
    notes?: string;
    custom_id?: string;
  }): Promise<Player> {
    const res = await fetch(`/api/teams/${teamId}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Player>(res);
  },

  async updatePlayer(teamId: string, playerId: string, data: Partial<Player>): Promise<Player> {
    const res = await fetch(`/api/teams/${teamId}/players/${playerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Player>(res);
  },

  async deletePlayer(teamId: string, playerId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/teams/${teamId}/players/${playerId}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  async batchAddSamplePlayers(teamId: string): Promise<{ count: number; players: Player[] }> {
    const res = await fetch(`/api/teams/${teamId}/players/batch`, {
      method: 'POST',
    });
    return handleResponse<{ count: number; players: Player[] }>(res);
  },

  // Rosters
  async getRosters(teamId: string): Promise<RosterPreset[]> {
    const res = await fetch(`/api/teams/${teamId}/rosters`);
    return handleResponse<RosterPreset[]>(res);
  },

  async createRoster(teamId: string, data: {
    name: string;
    is_default?: number;
    dh_rule?: number;
    starting_pitcher_id?: string | null;
    lineup: any[];
    bullpen?: any[];
    bench?: any[];
    description?: string;
  }): Promise<RosterPreset> {
    const res = await fetch(`/api/teams/${teamId}/rosters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<RosterPreset>(res);
  },

  async updateRoster(teamId: string, rosterId: string, data: any): Promise<RosterPreset> {
    const res = await fetch(`/api/teams/${teamId}/rosters/${rosterId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<RosterPreset>(res);
  },

  async deleteRoster(teamId: string, rosterId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/teams/${teamId}/rosters/${rosterId}`, {
      method: 'DELETE',
    });
    return handleResponse<{ success: boolean }>(res);
  },

  // Reset Database
  async resetDatabase(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/reset-db', {
      method: 'POST',
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },
};

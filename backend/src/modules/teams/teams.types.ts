export interface CreateTeamDTO {
  name: string;
  description?: string;
}

export interface TeamSummary {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
}

export interface AuthActor {
  userId: string;
  workspaceId: string;
  role: string;
}

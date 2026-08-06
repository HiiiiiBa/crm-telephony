export enum DealStage {
  LEAD = 'LEAD',
  QUALIFIE = 'QUALIFIE',
  PROPOSITION = 'PROPOSITION',
  NEGOTIATION = 'NEGOTIATION',
  GAGNE = 'GAGNE',
  PERDU = 'PERDU',
}

export const DEAL_STAGES: DealStage[] = [
  DealStage.LEAD,
  DealStage.QUALIFIE,
  DealStage.PROPOSITION,
  DealStage.NEGOTIATION,
  DealStage.GAGNE,
  DealStage.PERDU,
];

export const STAGE_LABELS: Record<DealStage, string> = {
  [DealStage.LEAD]: 'Lead',
  [DealStage.QUALIFIE]: 'Qualifié',
  [DealStage.PROPOSITION]: 'Proposition',
  [DealStage.NEGOTIATION]: 'Négociation',
  [DealStage.GAGNE]: 'Gagné',
  [DealStage.PERDU]: 'Perdu',
};

export interface DealContact {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
}

export interface DealOwner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  stage: DealStage;
  contactId: string;
  ownerId: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  contact: DealContact;
  owner: DealOwner;
}

export interface DealStageStats {
  count: number;
  totalValue: number;
}

export type DealStats = Record<DealStage, DealStageStats>;

export interface CreateDealDto {
  title: string;
  value: number;
  stage?: DealStage;
  contactId: string;
  ownerId?: string;
}

export type UpdateDealDto = Partial<CreateDealDto>;

export interface DealsResponse {
  data: Deal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

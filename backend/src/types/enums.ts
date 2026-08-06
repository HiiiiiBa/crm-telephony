export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  AGENT = 'AGENT',
}

export enum DealStage {
  LEAD = 'LEAD',
  QUALIFIE = 'QUALIFIE',
  PROPOSITION = 'PROPOSITION',
  NEGOTIATION = 'NEGOTIATION',
  GAGNE = 'GAGNE',
  PERDU = 'PERDU',
}

export enum CallDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export enum CallStatus {
  RINGING = 'RINGING',
  CONNECTED = 'CONNECTED',
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
  FAILED = 'FAILED',
  VOICEMAIL = 'VOICEMAIL',
}

export enum MessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RECEIVED = 'RECEIVED',
}

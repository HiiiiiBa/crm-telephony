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

/** Statut de présence agent (style Ringover). */
export enum PresenceStatus {
  ONLINE = 'ONLINE',
  ON_CALL = 'ON_CALL',
  PAUSE = 'PAUSE',
  OFFLINE = 'OFFLINE',
}

export enum NotificationType {
  MISSED_CALL = 'MISSED_CALL',
  NEW_SMS = 'NEW_SMS',
  INCOMING_CALL = 'INCOMING_CALL',
  SYSTEM = 'SYSTEM',
}

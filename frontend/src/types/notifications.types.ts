export type NotificationType = 'MISSED_CALL' | 'NEW_SMS' | 'INCOMING_CALL' | 'SYSTEM';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  items: AppNotification[];
  unreadCount: number;
}

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  MISSED_CALL: '📞',
  NEW_SMS: '💬',
  INCOMING_CALL: '📲',
  SYSTEM: 'ℹ️',
};

export const formatNotificationTime = (iso: string): string => {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'À l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH} h`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

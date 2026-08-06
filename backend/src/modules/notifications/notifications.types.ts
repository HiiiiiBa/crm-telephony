import { NotificationType } from '../../types/enums.js';

export interface CreateNotificationDTO {
  userId: string;
  workspaceId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  userId: string;
  workspaceId: string;
  createdAt: Date;
}

export interface NotificationsResult {
  items: NotificationItem[];
  unreadCount: number;
}

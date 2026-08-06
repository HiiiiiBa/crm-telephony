import { prisma } from '../../services/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { NotificationType } from '../../types/enums.js';
import { CreateNotificationDTO, NotificationItem, NotificationsResult } from './notifications.types.js';

const DEFAULT_LIMIT = 30;

export class NotificationsService {
  static async create(data: CreateNotificationDTO): Promise<NotificationItem> {
    const notification = await prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        body: data.body,
        link: data.link ?? null,
        userId: data.userId,
        workspaceId: data.workspaceId,
      },
    });

    return notification as NotificationItem;
  }

  static async createForMissedCall(callId: string): Promise<void> {
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });

    if (!call || call.status !== 'MISSED') return;

    const contactLabel = call.contact
      ? `${call.contact.firstName} ${call.contact.lastName}`
      : call.callerNumber;

    await NotificationsService.create({
      userId: call.agentId,
      workspaceId: call.workspaceId,
      type: NotificationType.MISSED_CALL,
      title: 'Appel manqué',
      body: `Appel manqué de ${contactLabel}`,
      link: call.contactId ? `/contacts/${call.contactId}` : '/calls',
    });
  }

  static async list(userId: string, workspaceId: string, limit = DEFAULT_LIMIT): Promise<NotificationsResult> {
    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId, workspaceId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({ where: { userId, workspaceId, isRead: false } }),
    ]);

    return {
      items: items as NotificationItem[],
      unreadCount,
    };
  }

  static async markRead(userId: string, workspaceId: string, notificationId: string): Promise<NotificationItem> {
    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, userId, workspaceId },
    });

    if (!existing) {
      const err: AppError = new Error('Notification introuvable.');
      err.statusCode = 404;
      throw err;
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return updated as NotificationItem;
  }

  static async markAllRead(userId: string, workspaceId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, workspaceId, isRead: false },
      data: { isRead: true },
    });
    return result.count;
  }
}

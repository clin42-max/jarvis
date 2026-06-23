import type { NotificationPayload } from '../../shared/types';
export declare class NotificationService {
    send(payload: Omit<NotificationPayload, 'id'>): void;
    getUnread(): NotificationPayload[];
    markRead(id: string): void;
}
export declare const notificationService: NotificationService;
//# sourceMappingURL=notification-service.d.ts.map
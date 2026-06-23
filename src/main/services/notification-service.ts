import { Notification, BrowserWindow } from 'electron';
import { generateId } from '../security/encryption';
import { getDatabase } from '../database/database';
import type { NotificationPayload } from '../../shared/types';
import { settingsService } from './settings-service';

export class NotificationService {
  send(payload: Omit<NotificationPayload, 'id'>): void {
    const settings = settingsService.getAppSettings();
    const id = generateId();

    const db = getDatabase();
    db.prepare(`INSERT INTO notifications (id, title, body, priority) VALUES (?, ?, ?, ?)`)
      .run(id, payload.title, payload.body, payload.priority);

    if (settings.notifications.desktop) {
      const notification = new Notification({
        title: payload.title,
        body: payload.body,
        silent: payload.priority === 'low',
      });
      notification.show();
    }

    if (settings.notifications.voice && payload.speak) {
      const windows = BrowserWindow.getAllWindows();
      for (const win of windows) {
        win.webContents.send('notify:speak', payload.body);
      }
    }
  }

  getUnread(): NotificationPayload[] {
    const db = getDatabase();
    return db.prepare('SELECT * FROM notifications WHERE read = 0 ORDER BY created_at DESC LIMIT 20')
      .all()
      .map((r) => {
        const row = r as { id: string; title: string; body: string; priority: string };
        return { id: row.id, title: row.title, body: row.body, priority: row.priority as NotificationPayload['priority'] };
      });
  }

  markRead(id: string): void {
    getDatabase().prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(id);
  }
}

export const notificationService = new NotificationService();

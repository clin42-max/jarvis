"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const electron_1 = require("electron");
const encryption_1 = require("../security/encryption");
const database_1 = require("../database/database");
const settings_service_1 = require("./settings-service");
class NotificationService {
    send(payload) {
        const settings = settings_service_1.settingsService.getAppSettings();
        const id = (0, encryption_1.generateId)();
        const db = (0, database_1.getDatabase)();
        db.prepare(`INSERT INTO notifications (id, title, body, priority) VALUES (?, ?, ?, ?)`)
            .run(id, payload.title, payload.body, payload.priority);
        if (settings.notifications.desktop) {
            const notification = new electron_1.Notification({
                title: payload.title,
                body: payload.body,
                silent: payload.priority === 'low',
            });
            notification.show();
        }
        if (settings.notifications.voice && payload.speak) {
            const windows = electron_1.BrowserWindow.getAllWindows();
            for (const win of windows) {
                win.webContents.send('notify:speak', payload.body);
            }
        }
    }
    getUnread() {
        const db = (0, database_1.getDatabase)();
        return db.prepare('SELECT * FROM notifications WHERE read = 0 ORDER BY created_at DESC LIMIT 20')
            .all()
            .map((r) => {
            const row = r;
            return { id: row.id, title: row.title, body: row.body, priority: row.priority };
        });
    }
    markRead(id) {
        (0, database_1.getDatabase)().prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(id);
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
//# sourceMappingURL=notification-service.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.hashValue = hashValue;
exports.generateId = generateId;
exports.isDestructiveCommand = isDestructiveCommand;
exports.sanitizePath = sanitizePath;
const crypto_1 = __importDefault(require("crypto"));
const crypto_2 = require("crypto");
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
function getEncryptionKey() {
    const keyPath = path_1.default.join(electron_1.app.getPath('userData'), '.jarvis-key');
    if (fs_1.default.existsSync(keyPath)) {
        return fs_1.default.readFileSync(keyPath);
    }
    const key = (0, crypto_2.scryptSync)((0, crypto_2.randomBytes)(32).toString('hex'), 'jarvis-salt', KEY_LENGTH);
    fs_1.default.writeFileSync(keyPath, key, { mode: 0o600 });
    return key;
}
function encrypt(text) {
    const key = getEncryptionKey();
    const iv = (0, crypto_2.randomBytes)(16);
    const cipher = (0, crypto_2.createCipheriv)(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}
function decrypt(encryptedText) {
    try {
        const key = getEncryptionKey();
        const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = (0, crypto_2.createDecipheriv)(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch {
        return '';
    }
}
function hashValue(value) {
    return crypto_1.default.createHash('sha256').update(value).digest('hex');
}
function generateId() {
    return crypto_1.default.randomUUID();
}
const DESTRUCTIVE_PATTERNS = [
    /delete\s+(all|everything)/i,
    /format\s+(drive|disk|c:)/i,
    /rm\s+-rf/i,
    /remove\s+system/i,
];
function isDestructiveCommand(command) {
    return DESTRUCTIVE_PATTERNS.some((p) => p.test(command));
}
function sanitizePath(userPath, allowedRoots) {
    const normalized = path_1.default.normalize(userPath);
    if (normalized.includes('..'))
        return null;
    if (allowedRoots) {
        const isAllowed = allowedRoots.some((root) => normalized.startsWith(path_1.default.normalize(root)));
        if (!isAllowed)
            return null;
    }
    return normalized;
}
//# sourceMappingURL=encryption.js.map
# JARVIS Database Schema

SQLite database stored at `%APPDATA%/jarvis-desktop/jarvis.db`

## Tables

### settings
Key-value store for application configuration.
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,        -- JSON serialized
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### memory
Persistent user memory and preferences.
```sql
CREATE TABLE memory (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,     -- preference|app|command|voice|routine|workflow|fact
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  metadata TEXT,              -- JSON optional
  created_at TEXT,
  updated_at TEXT
);
```

### chat_history
Conversation history with AI providers.
```sql
CREATE TABLE chat_history (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,         -- user|assistant|system
  content TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  timestamp TEXT
);
```

### ai_profiles
Custom AI personality profiles.
```sql
CREATE TABLE ai_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  personality TEXT,
  custom_instructions TEXT,
  task_types TEXT,            -- JSON array
  is_default INTEGER DEFAULT 0,
  created_at TEXT
);
```

### workflows
Automation workflow definitions.
```sql
CREATE TABLE workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- startup|schedule|battery|voice|event
  trigger_config TEXT NOT NULL, -- JSON
  actions TEXT NOT NULL,       -- JSON array
  enabled INTEGER DEFAULT 1,
  created_at TEXT
);
```

### plugins
Installed plugin registry.
```sql
CREATE TABLE plugins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  author TEXT,
  commands TEXT,              -- JSON array
  enabled INTEGER DEFAULT 0,
  installed_at TEXT
);
```

### notifications
Notification history.
```sql
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  read INTEGER DEFAULT 0,
  created_at TEXT
);
```

### voice_profiles
Voice synthesis profiles.
```sql
CREATE TABLE voice_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  engine TEXT NOT NULL,
  voice_id TEXT,
  rate REAL DEFAULT 1.0,
  pitch REAL DEFAULT 1.0,
  is_default INTEGER DEFAULT 0,
  created_at TEXT
);
```

### wake_words
Custom wake word registry.
```sql
CREATE TABLE wake_words (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  enabled INTEGER DEFAULT 1,
  created_at TEXT
);
```

### tasks
User task list.
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT,
  completed INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'normal',
  created_at TEXT
);
```

### reminders
Scheduled reminders.
```sql
CREATE TABLE reminders (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  trigger_at TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  created_at TEXT
);
```

### usage_logs
Command and action usage tracking.
```sql
CREATE TABLE usage_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TEXT
);
```

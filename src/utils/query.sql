CREATE TABLE IF NOT EXISTS messagin.users (
  id TEXT PRIMARY KEY,
  flags INT,
  username TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  password TEXT,
  mfa TEXT,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messagin.signups (
  id TEXT,
  flags INT,
  username TEXT,
  email TEXT,
  password TEXT,
  token_ TEXT,
  code TEXT,
  created_at TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS messagin.spaces (
  id TEXT PRIMARY KEY,
  name TEXT,
  flags INT,
  owner_id TEXT,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messagin.chats (
  id TEXT PRIMARY KEY,
  space_id TEXT,
  name TEXT,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messagin.members (
  space_id TEXT,
  user_id TEXT,
  share INT,
  permissions INT,
  color INT,
  created_at TIMESTAMP,
  PRIMARY KEY (space_id, user_id)
);

CREATE TABLE IF NOT EXISTS messagin.invites (
  id TEXT PRIMARY KEY,
  space_id TEXT,
  uses INT,
  max_uses INT,
  max_age INT,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messagin.messages (
  id TEXT,
  user_id TEXT,
  chat_id TEXT,
  content TEXT,
  flags INT,
  PRIMARY KEY (user_id, chat_id)
);

CREATE TABLE IF NOT EXISTS messagin.sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  token_ TEXT,
  flags INT,
  browser TEXT,
  os TEXT,
  ip TEXT,
  ua TEXT,
  updated_at TIMESTAMP,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messagin.relations (
  user_id0 TEXT,
  user_id1 TEXT,
  flags INT,
  updated_at TIMESTAMP,
  created_at TIMESTAMP,
  PRIMARY KEY (user_id0, user_id1)
);

CREATE TABLE IF NOT EXISTS messagin.password_resets (
  id TEXT PRIMARY KEY,
  token_ TEXT
);

CREATE TABLE IF NOT EXISTS messagin.email_validations (
  id TEXT PRIMARY KEY,
  token_ TEXT
);

CREATE TABLE IF NOT EXISTS messagin.rate_limits (
  id TEXT PRIMARY KEY,
  type TEXT,
  ip TEXT,
  count INT,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messagin.roles (
  id TEXT PRIMARY KEY,
  space_id TEXT,
  flags INT,
  permissions INT,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messagin.member_roles (
  space_id TEXT,
  user_id TEXT,
  role_id TEXT,
  PRIMARY KEY (space_id, user_id, role_id)
);

CREATE TABLE IF NOT EXISTS messagin.chat_members (
  chat_id TEXT,
  user_id TEXT,
  flags INT,
  created_at TIMESTAMP,
  PRIMARY KEY (chat_id, user_id)
);

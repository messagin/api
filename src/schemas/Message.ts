import { generateIDv2 } from "../utils/auth";
import db from "../utils/database";
import { PartialUser } from "./User";

const MessageFlags = {
  System: 1 << 0,
} as const;

type MessageFlag = keyof typeof MessageFlags;

interface BaseMessage {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  flags: number;
  updated_at?: string;
  created_at: string;
}

interface CleanMessage {
  id: string;
  chat_id: string;
  user: PartialUser;
  content: string;
  flags: number;
  updated_at?: string;
  created_at: string;
};

export class Message implements BaseMessage {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  flags: number;
  updated_at?: string;
  created_at: string;
  user: PartialUser;

  constructor(id?: string, time?: string) {
    this.id = id ?? generateIDv2();
    this.chat_id = "";
    this.user_id = "";
    this.content = "";
    this.flags = 0;
    this.created_at = time ?? new Date().toISOString();
    this.user = {
      id: "",
      username: ""
    }
  }

  setChat(id: string) {
    this.chat_id = id;
    return this;
  }

  setUser(id: string) {
    this.user_id = id;
    return this;
  }

  setContent(content: string) {
    this.content = content;
    return this;
  }

  setUpdatedAt(time?: string) {
    this.updated_at = time;
    return this;
  }

  setFlag(flag: MessageFlag) {
    this.flags |= MessageFlags[flag];
    return this;
  }

  setFlags(flags: number) {
    this.flags = flags;
    return this;
  }

  async getUserData(): Promise<PartialUser> {
    const raw_user = (await db.execute("SELECT (id,username) FROM users WHERE", [], { prepare: true })).rows[0];
    const user: PartialUser = {
      id: raw_user.id,
      username: raw_user.username
    };
    this.user = user;
    return user;
  }

  static async getById(id: string): Promise<Message | null> {
    const message = (await db.execute("SELECT * FROM messages WHERE id = ? LIMIT 1", [id], { prepare: true })).rows[0];
    if (!message) return null;
    return new Message(message.id, message.created_at)
      .setChat(message.chat_id)
      .setContent(message.content)
      .setFlags(message.flags)
      .setUser(message.user_id)
      .setUpdatedAt(message.updated_at);
  }

  static async exists(id: string) {
    const count = (await db.execute("SELECT count(*) FROM messages WHERE id = ?", [id], { prepare: true })).rows[0].count.low;
    return count > 0;
  }

  clean(): CleanMessage {
    return {
      id: this.id,
      chat_id: this.chat_id,
      user: {
        id: this.user.id,
        username: this.user.username
      },
      content: this.content,
      flags: this.flags,
      updated_at: this.updated_at,
      created_at: this.created_at
    }
  }

  async create() {
    await db.execute("INSERT INTO messages (chat_id,content,flags,id,user_id,updated_at,created_at) VALUES (?,?,?,?,?,?,?)", [this.chat_id, this.content, this.flags, this.id, this.user_id, this.updated_at, this.created_at], { prepare: true });
    return this;
  }

  async update() {
    this.updated_at = new Date().toISOString();
    await db.execute("UPDATE messages SET content = ?, updated_at = ? WHERE id = ?", [this.content, this.updated_at, this.id], { prepare: true });
  }

  async delete() {
    await db.execute("DELETE FROM messages WHERE id = ? AND chat_id = ?", [this.id, this.chat_id], { prepare: true });
    return this;
  }
}

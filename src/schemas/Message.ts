import { generateIDv2 } from "../utils/auth.node";
import db from "../utils/database";

const MessageFlags = {
  System: 1 << 0,
};

type MessageFlag = keyof typeof MessageFlags;

interface BaseMessage {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  flags: number;
  updated_at: string | null;
  created_at: string;
}

type CleanMessage = Omit<BaseMessage, "">;

export class Message implements BaseMessage {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  flags: number;
  updated_at: string | null;
  created_at: string;

  constructor(id?: string, time?: string) {
    this.id = id ?? generateIDv2();
    this.chat_id = "";
    this.user_id = "";
    this.content = "";
    this.flags = 0;
    this.updated_at = null;
    this.created_at = time ?? new Date().toISOString();
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

  setUpdatedAt(time: string | null) {
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

  static async getById(id: string) {
    const message = (await db.execute("SELECT * FROM messages WHERE id = ? LIMIT 1", [id], { prepare: true })).rows[0];
    // const message = await db.messages.where({ id }).first();
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
      user_id: this.user_id,
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

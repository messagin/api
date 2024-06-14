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
  updated_at: number;
  created_at: number;
}

type CleanMessage = Omit<BaseMessage, "">;

export class Message implements BaseMessage {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  flags: number;
  updated_at: number;
  created_at: number;

  constructor(id?: string, time?: number) {
    this.id = id ?? generateIDv2();
    this.chat_id = "";
    this.user_id = "";
    this.content = "";
    this.flags = 0;
    this.updated_at = 0;
    this.created_at = time ?? Date.now();
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

  setUpdatedAt(time: number) {
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
    const message = await db.messages.where({ id }).first();
    if (!message) return null;
    return new Message(message.id, message.created_at)
      .setChat(message.chat_id)
      .setContent(message.content)
      .setFlags(message.flags)
      .setUser(message.user_id)
      .setUpdatedAt(message.updated_at);
  }

  static async exists(id: string) {
    const count = await db.messages.where({ id }).count().first() as { "count(*)": number };
    return count["count(*)"] > 0;
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
    await db.messages.insert({
      chat_id: this.chat_id,
      content: this.content,
      flags: this.flags,
      id: this.id,
      user_id: this.user_id,
      updated_at: this.updated_at,
      created_at: this.created_at
    });
    return this;
  }

  async update() {
    this.updated_at = Date.now();
    await db.messages.update({
      content: this.content,
      updated_at: this.updated_at
    }).where({ id: this.id });
  }

  async delete() {
    await db.messages.delete().where({ id: this.id });
    return this;
  }
}

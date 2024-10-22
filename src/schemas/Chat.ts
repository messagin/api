import { ChatMemberManager } from "../managers/ChatMember";
import { MessageManager } from "../managers/Message";
import { generateIDv2 } from "../utils/auth";
import db from "../utils/database";

const ChatFlags = {
  Deleted: 1 << 0,
} as const;

type ChatFlag = keyof typeof ChatFlags;

interface BaseSpaceChat {
  id: string;
  name: string;
  flags: number;
  space_id: string | null;
  created_at: string;
};

interface BaseUserChat {
  id: string;
  name: string;
  flags: number;
  created_at: string;
};

export class SpaceChat implements BaseSpaceChat {
  id: string;
  name: string;
  flags: number;
  space_id: string;
  created_at: string;

  constructor(id?: string, time?: string) {
    this.id = id ?? generateIDv2();
    this.name = "";
    this.flags = 0;
    this.space_id = "";
    this.created_at = time ?? new Date().toISOString();
  }

  setSpace(id: string) {
    this.space_id = id;
    return this;
  }

  setName(name: string) {
    this.name = name;
    return this;
  }

  setFlag(flag: ChatFlag) {
    this.flags |= ChatFlags[flag];
    return this;
  }

  clearFlag(flag: ChatFlag) {
    this.flags &= ~ChatFlags[flag];
    return this;
  }

  hasFlag(flag: ChatFlag) {
    return (this.flags & ChatFlags[flag]) !== 0;
  }

  setFlags(flags: number) {
    this.flags = flags;
    return this;
  }

  static async getById(id: string): Promise<SpaceChat | null> {
    const chat = (await db.execute("SELECT * FROM space_chats WHERE id = ? LIMIT 1", [id], { prepare: true })).rows[0];
    if (!chat) return null;
    return new SpaceChat(chat.id, chat.created_at)
      .setSpace(chat.space_id)
      .setName(chat.name)
      .setFlags(chat.flags)
  }

  static async exists(id: string) {
    const count = (await db.execute("SELECT count(*) FROM space_chats WHERE id = ?", [id], { prepare: true })).rows[0].count.low;
    return count > 0;
  }

  async create() {
    await db.execute("INSERT INTO space_chats (id,name,flags,space_id,created_at) VALUES (?,?,?,?,?)", [this.id, this.name, this.flags, this.space_id, this.created_at], { prepare: true });
    return this;
  }

  get messages() {
    return new MessageManager(this.id);
  }

  async delete() {
    // deleting a chat also deletes its messages
    await db.execute("DELETE FROM messages WHERE chat_id = ?", [this.id], { prepare: true });
    await db.execute("DELETE FROM space_chats WHERE id = ?", [this.id], { prepare: true });
    return this;
  }

  async update() {
    await db.execute("UPDATE space_chats SET name = ? WHERE id = ? AND space_id = ?", [this.name, this.id, this.space_id], { prepare: true });
    return this;
  }
}

export class UserChat implements BaseUserChat {
  id: string;
  name: string;
  flags: number;
  created_at: string;

  constructor(id?: string, time?: string) {
    this.id = id ?? generateIDv2();
    this.name = "";
    this.flags = 0;
    this.created_at = time ?? new Date().toISOString();
  }

  setName(name: string) {
    this.name = name;
    return this;
  }

  setFlag(flag: ChatFlag) {
    this.flags |= ChatFlags[flag];
    return this;
  }

  clearFlag(flag: ChatFlag) {
    this.flags &= ~ChatFlags[flag];
    return this;
  }

  hasFlag(flag: ChatFlag) {
    return (this.flags & ChatFlags[flag]) !== 0;
  }

  setFlags(flags: number) {
    this.flags = flags;
    return this;
  }

  get members() {
    return new ChatMemberManager(this.id);
  }

  async create() {
    await db.execute("INSERT INTO chats (id,name,flags,created_at) VALUES (?,?,?,?)", [this.id, this.name, this.flags, this.created_at], { prepare: true });
    return this;
  }

  static async getById(id: string): Promise<UserChat | null> {
    const chat = (await db.execute("SELECT * FROM chats WHERE id = ? LIMIT 1", [id], { prepare: true })).rows[0];
    if (!chat) return null;
    return new UserChat(chat.id, chat.created_at)
      .setName(chat.name)
      .setFlags(chat.flags);
  }

  async delete() {
    // deleting a chat also deletes its messages
    await db.execute("DELETE FROM messages WHERE chat_id = ?", [this.id], { prepare: true });
    await db.execute("DELETE FROM chats WHERE id = ?", [this.id], { prepare: true });
    return this;
  }

}

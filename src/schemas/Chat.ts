import { MemberManager } from "../managers/Member";
import { MessageManager } from "../managers/Message";
import { generateIDv2 } from "../utils/auth";
import db from "../utils/database";

const ChatFlags = {
  Deleted: 1 << 0,
} as const;

const ChatTypes = {
  TEXT: 0,
  DM: 1,
  DM_SEC: 2,
  DM_2RP: 3
}

type ChatType = keyof typeof ChatTypes;
type ChatFlag = keyof typeof ChatFlags;

interface BaseChat {
  id: string;
  name: string;
  type: number;
  flags: number;
  space_id: string;
  position: number;
};

export class Chat implements BaseChat {
  id: string;
  name: string;
  type: number;
  flags: number;
  space_id: string;
  position: number;

  constructor(id?: string) {
    this.id = id ?? generateIDv2();
    this.name = "";
    this.flags = 0;
    this.type = ChatTypes.TEXT;
    this.position = 0;
    this.space_id = "";
  }

  setSpace(id?: string) {
    this.space_id = id ?? "";
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

  setPosition(position: number) {
    this.position = position;
    return this;
  }

  setType(type: ChatType) {
    this.type = ChatTypes[type];
    return this;
  }

  static async getById(id: string): Promise<Chat | null> {
    const chat = (await db.execute("SELECT * FROM chats WHERE id = ? LIMIT 1", [id], { prepare: true })).rows[0];
    if (!chat) return null;
    return new Chat(chat.id)
      .setPosition(chat.position)
      .setSpace(chat.space_id)
      .setName(chat.name)
      .setFlags(chat.flags);
  }

  static async exists(id: string) {
    const count = (await db.execute("SELECT count(*) FROM chats WHERE id = ?", [id], { prepare: true })).rows[0].count.low;
    return count > 0;
  }

  async create() {
    await db.execute("INSERT INTO chats (id,space_id,flags,type,name,position) VALUES (?,?,?,?,?,?)", [this.id, this.space_id, this.flags, this.type, this.name, this.position], { prepare: true });
    return this;
  }

  get messages() {
    return new MessageManager(this.id);
  }

  get members() {
    if (this.type == ChatTypes.TEXT) throw new Error("Cannot access members of a space chat");
    return new MemberManager(this.id);
  }

  async delete() {
    // deleting a chat also deletes its messages
    await db.execute("DELETE FROM messages WHERE chat_id = ?", [this.id], { prepare: true });
    await db.execute("DELETE FROM chats WHERE id = ?", [this.id], { prepare: true });
    return this;
  }

  async update() {
    await db.execute("UPDATE chats SET name = ?, position = ? WHERE id = ? AND space_id = ?", [this.name, this.position, this.id, this.space_id], { prepare: true });
    return this;
  }
}

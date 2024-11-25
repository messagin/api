import { AxolotlMessageManager } from "../managers/AxolotlMessage";
import { ChatMemberManager } from "../managers/ChatMember";
import { MessageManager } from "../managers/Message";
import { generateIDv2 } from "../utils/auth";
import db from "../utils/database";

const ChatFlags = {
  Deleted: 1 << 0,
} as const;

export enum ChatTypes {
  TEXT,
  DM,
  DM_SEC,
  DM_AXOLOTL,
};

type ChatFlag = keyof typeof ChatFlags;

interface BaseChat<T extends ChatTypes> {
  id: string;
  name: string;
  type: T;
  flags: number;
  space_id: string;
  position: number;
};

interface CleanTextChat {
  id: string;
  name: string;
  type: ChatTypes.TEXT;
  flags: number;
  space_id: string;
  position: number;
};

interface CleanDMChat {
  id: string;
  name: string;
  type: ChatTypes;
  flags: number;
};

type CleanChat<T extends ChatTypes> = T extends ChatTypes.TEXT
  ? CleanTextChat : CleanDMChat;

type SelectMessageManager<T extends ChatTypes> = T extends ChatTypes.TEXT
  ? MessageManager : T extends ChatTypes.DM_AXOLOTL
  ? AxolotlMessageManager : MessageManager;

export class Chat<T extends ChatTypes> implements BaseChat<T> {
  id: string;
  name: string;
  type: T;
  flags: number;
  space_id: string;
  position: number;

  constructor(type: T, id?: string) {
    this.id = id ?? generateIDv2();
    this.name = "";
    this.flags = 0;
    this.type = type;
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

  clean(): CleanChat<T> {
    switch (this.type) {
      case ChatTypes.DM:
        return {
          id: this.id,
          flags: this.flags,
          name: this.name,
          type: this.type
        } as CleanChat<T>;
      default:
        return {
          id: this.id,
          flags: this.flags,
          name: this.name,
          type: this.type,
          space_id: this.space_id,
          position: this.position
        } as CleanChat<T>;
    }
  }

  isTextChat(): this is Chat<ChatTypes.TEXT> {
    return this.type === ChatTypes.TEXT;
  }

  isAxolotlChat(): this is Chat<ChatTypes.DM_AXOLOTL> {
    return this.type === ChatTypes.DM_AXOLOTL;
  }

  static async getById<T extends ChatTypes>(id: string): Promise<Chat<T> | null> {
    const chat = (await db.execute("SELECT * FROM chats WHERE id = ? LIMIT 1", [id], { prepare: true })).rows[0];
    if (!chat) return null;
    return new Chat(chat.type, chat.id)
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

  get messages(): SelectMessageManager<T> {
    if (this.isAxolotlChat()) {
      return new AxolotlMessageManager(this.id) as SelectMessageManager<T>;
    }
    return new MessageManager(this.id) as SelectMessageManager<T>;
  }

  get members() {
    if (this.type === ChatTypes.TEXT) throw new Error("Cannot access members of a space chat");
    return new ChatMemberManager(this.id);
  }

  private async deleteMessages() {
    if (this.isAxolotlChat()) {
      await db.execute("DELETE FROM axolotl_messages WHERE chat_id = ?", [this.id], { prepare: true });
      return;
    }
    await db.execute("DELETE FROM messages WHERE chat_id = ?", [this.id], { prepare: true });
    return;
  }

  async delete() {
    // deleting a chat also deletes its messages
    await this.deleteMessages();
    await db.execute("DELETE FROM chats WHERE id = ?", [this.id], { prepare: true });
    return this;
  }

  async update() {
    await db.execute("UPDATE chats SET name = ?, position = ? WHERE id = ? AND space_id = ?", [this.name, this.position, this.id, this.space_id], { prepare: true });
    return this;
  }
}

import { ChatMemberManager } from "../managers/ChatMember";
import { MessageManager } from "../managers/Message";
import { generateIDv2 } from "../utils/auth.node";
import db from "../utils/database";

const ChatFlags = {
  Deleted: 1 << 0,
};

type ChatFlag = keyof typeof ChatFlags;

interface BaseChat {
  id: string;
  name: string;
  flags: number;
  space_id: string | null;
  created_at: number;
};

export class Chat implements BaseChat {
  id: string;
  name: string;
  flags: number;
  space_id: string | null;
  created_at: number;

  constructor(id?: string, time?: number) {
    this.id = id ?? generateIDv2();
    this.name = "";
    this.flags = 0;
    this.space_id = null;
    this.created_at = time ?? Date.now();
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

  static async getById(id: string) {
    const chat = (await db.execute("SELECT * FROM chats WHERE id = ? LIMIT 1", [id])).rows[0];
    if (!chat) return null;
    return new Chat(chat.id, chat.created_at)
      .setFlags(chat.flags)
      .setName(chat.name);
  }

  static async exists(id: string) {
    const count = (await db.execute("SELECT count(*) FROM chats WHERE id = ?", [id])).rows[0].count.low;
    return count > 0;
  }

  async create() {
    await db.execute("INSERT INTO chats (id,name,space_id,created_at) VALUES (?,?,?,?)", [this.id, this.name, this.space_id, this.created_at]);
    return this;
  }

  get messages() {
    return new MessageManager(this.id);
  }

  async delete() {
    // deleting a chat also deletes its messages
    await db.execute("DELETE * FROM messages WHERE chat_id = ?", [this.id]);
    await db.execute("DELETE * FROM chats WHERE id = ?", [this.id]);
    return this;
  }

  async update() {
    await db.execute("UPDATE chats SET name = ? WHERE id = ?", [this.name, this.id]);
    return this;
  }
}

export class SpaceChat extends Chat {
  constructor(id?: string, time?: number) {
    super(id, time);
  }


  setSpace(id: string | null) {
    this.space_id = id;
    return this;
  }

  static async getById(id: string) {
    const chat = (await db.execute("SELECT * FROM chats WHERE id = ? LIMIT 1", [id])).rows[0];
    if (!chat) return null;
    return new SpaceChat(chat.id, chat.created_at)
      .setSpace(chat.space_id)
      .setName(chat.name)
      .setFlags(chat.flags)
  }
}

export class UserChat extends Chat {
  constructor(id?: string, time?: number) {
    super(id, time);
  }

  get members() {
    return new ChatMemberManager(this.id);
  }

  static async getById(id: string): Promise<UserChat | null> {
    const chat = (await db.execute("SELECT * FROM chats WHERE id = ? LIMIT 1", [id])).rows[0];
    if (!chat) return null;
    return new UserChat(chat.id, chat.created_at)
      .setName(chat.name)
      .setFlags(chat.flags);
  }
}

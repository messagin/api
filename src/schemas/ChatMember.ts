import db from "../utils/database";

const Flags = {
  Admin: 1 << 0
}

type Flag = keyof typeof Flags;

interface BaseChatMember {
  flags: number;
  chat_id: string;
  user_id: string;
  created_at: number;
}

export class ChatMember implements BaseChatMember {
  flags: number;
  chat_id: string;
  user_id: string;
  created_at: number;

  constructor(time?: number) {
    this.chat_id = "";
    this.user_id = "";
    this.flags = 0;
    this.created_at = time ?? Date.now();

    return this;
  }

  setChat(id: string) {
    this.chat_id = id;
    return this;
  }

  setUser(id: string) {
    this.user_id = id;
    return this
  }

  setFlags(flags: number) {
    this.flags = flags;
    return this;
  }

  setFlag(flag: Flag) {
    this.flags |= Flags[flag];
    // todo track updated entries (Member)
    return this;
  }

  clearFlag(flag: Flag) {
    this.flags &= ~Flags[flag];
    return this;
  }

  hasFlag(flag: Flag) {
    return (this.flags & Flags[flag]) !== 0;
  }

  async create() {
    await db.chatMembers.insert({
      flags: this.flags,
      user_id: this.user_id,
      chat_id: this.chat_id,
      created_at: this.created_at
    });
    return this;
  }

  async delete() {
    await db.chatMembers.delete().where({ user_id: this.user_id, chat_id: this.chat_id });
    return this;
  }

  static async exists(id: string, chat_id: string) {
    const count = await db.chatMembers.where({ user_id: id, chat_id }).count().first() as { "count(*)": number };
    return count["count(*)"] > 0;
  }

  static async get(chat_id: string, user_id: string) {
    const member = await db.chatMembers.where({ chat_id, user_id }).first();
    if (!member) return null;
    return new ChatMember(member.created_at)
      .setFlags(member.flags)
      .setChat(member.chat_id)
      .setUser(member.user_id);
  }
}

import db from "../utils/database";

const Flags = {
  Admin: 1 << 0
} as const;

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
    await db.execute("INSERT INTO chat_members (flags,user_id,chat_id,created_at) VALUES (?,?,?,?)", [this.flags, this.user_id, this.chat_id, this.created_at], { prepare: true });
    return this;
  }

  async delete() {
    await db.execute("DELETE FROM chat_members WHERE user_id = ? AND chat_id = ?", [this.user_id, this.chat_id], { prepare: true });
    return this;
  }

  static async exists(id: string, chat_id: string) {
    const count = (await db.execute("SELECT count(*) FROM chat_members WHERE user_id = ? AND chat_id = ?", [id, chat_id], { prepare: true })).rows[0].count.low;
    return count > 0;
  }

  static async get(chat_id: string, user_id: string) {
    const member = (await db.execute("SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?", [chat_id, user_id], { prepare: true })).rows[0];
    if (!member) return null;
    return new ChatMember(member.created_at)
      .setFlags(member.flags)
      .setChat(member.chat_id)
      .setUser(member.user_id);
  }
}

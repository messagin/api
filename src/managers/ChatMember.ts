import { ChatMember } from "../schemas/ChatMember";
import db from "../utils/database";

export class ChatMemberManager {
  private chat_id: string;

  constructor(chat_id: string) {
    this.chat_id = chat_id;
  }

  init(user_id: string): ChatMember {
    return new ChatMember()
      .setChat(this.chat_id)
      .setUser(user_id);
  }

  async get(user_id: string): Promise<ChatMember | null> {
    const member = (await db.execute("SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?", [this.chat_id, user_id], { prepare: true })).rows[0];
    if (!member) return null;
    return new ChatMember(member.created_at)
      .setFlags(member.flags)
      .setChat(member.chat_id)
      .setUser(member.user_id);
  }

  async list(): Promise<ChatMember[]> {
    const members = (await db.execute("SELECT * FROM chat_members WHERE chat_id = ?", [this.chat_id], { prepare: true })).rows;
    
    return members.map(member => new ChatMember()
      .setChat(member.chat_id)
      .setUser(member.user_id)
      .setFlags(member.flags)
    );
  }

  async has(user_id: string) {
    const member = (await db.execute("SELECT * FROM chat_members WHERE chat_id = ? AND user_id = ?", [this.chat_id, user_id], { prepare: true })).rows[0];
    if (!member) return false;
    return true;
  }
}

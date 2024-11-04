import { UserChat } from "../schemas/Chat";
import db from "../utils/database";

export class GlobalChatManager {
  private user_id: string;

  constructor(user_id: string) {
    this.user_id = user_id;
  }

  init(name: string) {
    return new UserChat().setName(name);
  }

  async list() {
    const chats = [];
    const member_entries = (await db.execute("SELECT chat_id FROM chat_members WHERE user_id = ?", [this.user_id], { prepare: true })).rows;
    for (const member_entry of member_entries) {
      const chat = (await db.execute("SELECT * FROM chats WHERE id = ?", [member_entry.chat_id], { prepare: true })).rows[0];
      if (!chat) continue;
      chats.push(chat);
    }

    return chats.map(chat => new UserChat(chat.id)
      .setName(chat.name)
    ).filter(chat => !chat.hasFlag("Deleted"));
  }
}

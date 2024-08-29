import { Chat } from "../schemas/Chat";
import db from "../utils/database";

export class GlobalChatManager {
  private user_id: string;

  constructor(user_id: string) {
    this.user_id = user_id;
  }

  init(name: string) {
    return new Chat().setName(name);
  }

  async list() {
    const chats = [];
    const member_entries = await db.selectFrom("chat_members", ["chat_id"], { user_id: this.user_id });
    for (const member_entry of member_entries) {
      const chat = await db.selectOneFrom("chats", "*", { id: member_entry.chat_id });
      if (!chat) continue;
      chats.push(chat);
    }

    return chats.map(chat => new Chat(chat.id, chat.created_at)
      .setName(chat.name)
    ).filter(chat => !chat.hasFlag("Deleted"));
  }
}

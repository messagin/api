import { Chat } from "../schemas/Chat";
import db from "../utils/database";

export class GlobalChatManager {
  private user_id: string;

  constructor(user_id: string) {
    this.user_id = user_id;
  }

  init(name: string) {
    return new Chat("DM").setName(name);
  }

  async list() {
    const chats = [];
    const member_entries = (await db.execute("SELECT chat_id FROM chat_members WHERE user_id = ?", [this.user_id], { prepare: true })).rows;
    for (const member_entry of member_entries) {
      const chat = await Chat.getById(member_entry.chat_id);
      if (!chat) continue;
      if (chat.hasFlag("Deleted")) continue;
      chats.push(chat.clean());
    }
    return chats;
  }
}

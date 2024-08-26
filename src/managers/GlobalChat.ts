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
    const chats = await db.spaces
      .join("chat-members", "chats.id", "=", "chat-members.chat_id")
      .select("chats.*")
      .where("chat-members.user_id", this.user_id);

    return chats.map(chat => new Chat(chat.id, chat.created_at)
      .setName(chat.name)
    ).filter(chat => !chat.hasFlag("Deleted"));
  }
}

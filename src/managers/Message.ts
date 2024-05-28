import { Message } from "../models/Message";
import db from "../utils/database";

export class MessageManager {
  private chat_id: string;

  constructor(chat_id: string) {
    this.chat_id = chat_id;
  }

  create(user_id: string) {
    return new Message().setChat(this.chat_id).setUser(user_id).create();
  }

  async list(options?: { limit?: number }) {
    let limit = options?.limit || 50;
    if (limit > 100) {
      limit = 100;
    }
    const raw_messages = await db.messages
      .select("id")
      .where({ chat_id: this.chat_id })
      .orderBy("id", "desc")
      .limit(limit);
    const messages: (Message | null)[] = [];

    for (const { id } of raw_messages) {
      messages.push(await Message.getById(id));
    }

    return messages.filter(Boolean) as Message[];
  }
}

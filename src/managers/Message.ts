import { Message } from "../schemas/Message";
import db from "../utils/database";

interface SearchOptions {
  query?: string;
  limit: number;
};

export class MessageManager {
  private chat_id: string;

  constructor(chat_id: string) {
    this.chat_id = chat_id;
  }

  create(user_id: string, content: string) {
    return new Message()
      .setChat(this.chat_id)
      .setUser(user_id)
      .setContent(content)
      .create();
  }

  async search(options: SearchOptions) {
    const raw_messages = await db.messages.select("id")
      .where({ chat_id: this.chat_id })
      .orderBy("id", "desc")
      .limit(options.limit);
    const messages: (Message | null)[] = [];

    for (const { id } of raw_messages) {
      messages.push(await Message.getById(id));
    }
    return messages.filter(Boolean) as Message[];
  }

  async list(options?: { limit?: number }) {
    // todo validate limit beforehand
    let limit = options?.limit || 50;
    if (limit > 100) {
      limit = 100;
    }
    const messages = await db.messages
      .where({ chat_id: this.chat_id })
      .orderBy("id", "desc")
      .limit(limit);

    return messages.map(message => new Message(message.id, message.created_at)
      .setChat(message.chat_id)
      .setContent(message.content)
      .setFlags(message.flags)
      .setUser(message.user_id)
      .setUpdatedAt(message.created_at)
    );
  }
}

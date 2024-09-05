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
    // todo modify to avoid querying the database several times

    const messages = (await db.execute("SELECT * FROM messages WHERE chat_id = ? ORDER BY id DESC LIMIT ?", [this.chat_id, options.limit], { prepare: true })).rows;

    return messages.map(message => new Message(message.id, message.created_at)
      .setChat(message.chat_id)
      .setContent(message.content)
      .setFlags(message.flags)
      .setUser(message.user_id)
      .setUpdatedAt(message.created_at)
    );
  }

  async list(options?: { limit?: number }) {
    // todo validate limit beforehand
    let limit = options?.limit || 50;
    if (limit > 100) {
      limit = 100;
    }

    const messages = (await db.execute("SELECT * FROM messages WHERE chat_id = ? ORDER BY id DESC", [this.chat_id], { prepare: true })).rows;

    return messages.map(message => new Message(message.id, message.created_at)
      .setChat(message.chat_id)
      .setContent(message.content)
      .setFlags(message.flags)
      .setUser(message.user_id)
      .setUpdatedAt(message.updated_at)
    );
  }
}

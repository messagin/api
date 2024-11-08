import { AxolotlMessage, AxolotlMessageBody } from "../schemas/AxolotlMessage";
import db from "../utils/database";

interface SearchOptions {
  query?: string;
  limit: number;
};

export class AxolotlMessageManager {
  private chat_id: string;

  constructor(chat_id: string) {
    this.chat_id = chat_id;
  }

  create(user_id: string, msg: AxolotlMessageBody) {
    return new AxolotlMessage()
      .setChat(this.chat_id)
      .setUser(user_id)
      .setContent(msg.content)
      .setPublicKey(msg.public_key)
      .setMessageNumber(msg.message_number)
      .create();
  }

  async search(options: SearchOptions) {
    const messages = (await db.execute("SELECT * FROM axolotl_messages WHERE chat_id = ? ORDER BY id DESC LIMIT ?", [this.chat_id, options.limit], { prepare: true })).rows;

    return messages.map(message => new AxolotlMessage(message.id, message.created_at)
      .setChat(message.chat_id)
      .setUser(message.user_id)
      .setContent(message.content)
      .setPublicKey(message.public_key)
      .setMessageNumber(message.message_number)
      .clean()
    );
  }

  async list(options?: { limit?: number }) {
    // todo validate limit beforehand
    let limit = options?.limit || 50;
    if (limit > 100) {
      limit = 100;
    }

    const messages = (await db.execute("SELECT * FROM axolotl_messages WHERE chat_id = ? ORDER BY id DESC", [this.chat_id], { prepare: true })).rows;

    return messages.map(message => new AxolotlMessage(message.id, message.created_at)
      .setChat(message.chat_id)
      .setUser(message.user_id)
      .setContent(message.content)
      .setPublicKey(message.public_key)
      .setMessageNumber(message.message_number)
      .clean()
    );
  }
}

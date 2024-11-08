import { generateIDv2 } from "../utils/auth";
import db from "../utils/database";

interface BaseAxolotlMessage {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  created_at: string;
  public_key: string;
  message_number: number;
}

export interface AxolotlMessageBody {
  content: string;
  public_key: string;
  message_number: number;
};

type CleanAxolotlMessage = Omit<BaseAxolotlMessage, "">

export class AxolotlMessage implements BaseAxolotlMessage {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  created_at: string;
  public_key: string;
  message_number: number;

  constructor(id?: string, time?: string) {
    this.id = id ?? generateIDv2();
    this.chat_id = "";
    this.user_id = "";
    this.content = "";
    this.created_at = time ?? new Date().toISOString();
    this.public_key = "";
    this.message_number = 0;
  }

  setChat(id: string) {
    this.chat_id = id;
    return this;
  }

  setUser(id: string) {
    this.user_id = id;
    return this;
  }

  setContent(content: string) {
    this.content = content;
    return this;
  }

  setMessageNumber(num: number) {
    this.message_number = num;
    return this;
  }

  setPublicKey(key: string) {
    this.public_key = key;
    return this;
  }

  static async getById(id: string): Promise<AxolotlMessage | null> {
    const message = (await db.execute("SELECT * FROM axolotl_messages WHERE id = ? LIMIT 1", [id], { prepare: true })).rows[0];
    if (!message) return null;
    return new AxolotlMessage(message.id, message.created_at)
      .setChat(message.chat_id)
      .setContent(message.content)
      .setMessageNumber(message.message_number)
      .setPublicKey(message.public_key)
      .setUser(message.user_id);
  }

  static async exists(id: string) {
    const count = (await db.execute("SELECT count(*) FROM axolotl_messages WHERE id = ?", [id], { prepare: true })).rows[0].count.low;
    return count > 0;
  }

  clean(): CleanAxolotlMessage {
    return {
      id: this.id,
      chat_id: this.chat_id,
      user_id: this.user_id,
      content: this.content,
      created_at: this.created_at,
      message_number: this.message_number,
      public_key: this.public_key
    };
  }

  async create() {
    await db.execute("INSERT INTO axolotl_messages (chat_id,id,user_id,content,created_at,message_number,public_key) VALUES (?,?,?,?,?,?,?)", [
      this.chat_id, this.id, this.user_id, this.content, this.created_at, this.message_number, this.public_key
    ], { prepare: true });
    return this;
  }

  async delete() {
    // do not delete the message because its public key and message number are required for chat integrity
    await db.execute("UPDATE axolotl_messages SET content = null WHERE id = ? AND chat_id = ?", [this.id, this.chat_id], { prepare: true });
    return this;
  }
}

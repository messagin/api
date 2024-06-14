import { MessageManager } from "../managers/Message";
import { generateIDv2 } from "../utils/auth.node";
import db from "../utils/database";

interface BaseChat {
  id: string;
  name: string;
  space_id: string;
  created_at: number;
};

export class Chat implements BaseChat {
  id: string;
  name: string;
  space_id: string;
  created_at: number;

  constructor(id?: string, time?: number) {
    this.id = id ?? generateIDv2();
    this.name = "";
    this.space_id = "";
    this.created_at = time ?? Date.now();
  }

  setSpace(id: string) {
    this.space_id = id;
    return this;
  }

  setName(name: string) {
    this.name = name;
    return this;
  }

  static async getById(id: string) {
    const chat = await db.chats.where({ id }).first();
    if (!chat) return null;
    return new Chat(chat.id, chat.created_at)
      .setSpace(chat.space_id)
      .setName(chat.name);
  }

  static async exists(id: string) {
    const count = await db.chats.where({ id }).count().first() as { "count(*)": number };
    return count["count(*)"] > 0;
  }

  async create() {
    await db.chats.insert({
      id: this.id,
      name: this.name,
      space_id: this.space_id,
      created_at: this.created_at
    });
    return this;
  }

  get messages() {
    return new MessageManager(this.id);
  }

  async delete() {
    // deleting a chat also deletes its messages
    await db.messages.where({ chat_id: this.id }).delete();
    await db.chats.where({ id: this.id }).delete();
    return this;
  }

  async update() {
    await db.chats.update({
      name: this.name
    }).where({ id: this.id });
    return this;
  }
}

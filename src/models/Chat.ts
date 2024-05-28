import { MessageManager } from "../managers/Message";
import { generateIDv2 } from "../utils/auth.node";
import db from "../utils/database";

interface BaseChat {
  id: string;
  name: string;
  space_id: string;
};

export class Chat implements BaseChat {
  id: string;
  name: string;
  space_id: string;

	constructor(id?: string) {
    this.id = id ?? generateIDv2();
    this.name = "";
    this.space_id = "";
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
		return new Chat(chat.id)
      .setSpace(chat.space_id)
      .setName(chat.name);
	}

	async create() {
    await db.chats.insert({
      id: this.id,
      name: this.name,
      space_id: this.space_id
    });
    return this;
	}

  get messages() {
    return new MessageManager(this.id);
  }

  async delete() {
    await db.messages.delete().where({ chat_id: this.id });
  }
}

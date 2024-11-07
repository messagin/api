import { Chat } from "../schemas/Chat";
import db from "../utils/database";

export class ChatManager {
  private space_id: string;

  constructor(space_id: string) {
    this.space_id = space_id;
  }

  init(name: string): Chat {
    return new Chat().setSpace(this.space_id).setName(name);
  }

  async list(): Promise<Chat[]> {
    const chats = (await db.execute("SELECT * FROM chats WHERE space_id = ?", [this.space_id], { prepare: true })).rows;

    return chats.map(chat => new Chat(chat.id)
      .setSpace(chat.space_id)
      .setFlags(chat.flags)
      .setName(chat.name)
    );
  }
}

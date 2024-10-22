import { SpaceChat } from "../schemas/Chat";
import db from "../utils/database";

export class ChatManager {
  private space_id: string;

  constructor(space_id: string) {
    this.space_id = space_id;
  }

  init(name: string): SpaceChat {
    return new SpaceChat().setSpace(this.space_id).setName(name);
  }

  async list(): Promise<SpaceChat[]> {
    const chats = (await db.execute("SELECT * FROM space_chats WHERE space_id = ?", [this.space_id], { prepare: true })).rows;

    return chats.map(chat => new SpaceChat(chat.id, chat.created_at)
      .setSpace(chat.space_id)
      .setFlags(chat.flags)
      .setName(chat.name)
    );
  }
}

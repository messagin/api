import { Chat } from "../models/Chat";
import db from "../utils/database";

export class ChatManager {
  private space_id: string;

  constructor(space_id: string) {
    this.space_id = space_id;
  }

  create(name: string) {
    return new Chat().setSpace(this.space_id).setName(name);
  }

  async list() {
    const raw_chats = await db.chats.select("id").where({ space_id: this.space_id });
    const chats: (Chat | null)[] = [];

    for (const { id } of raw_chats) {
      chats.push(await Chat.getById(id));
    }

    return chats.filter(Boolean) as Chat[];
  }
}

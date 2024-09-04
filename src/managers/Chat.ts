import { SpaceChat } from "../schemas/Chat";
import db from "../utils/database";

export class ChatManager {
  private space_id: string;

  constructor(space_id: string) {
    this.space_id = space_id;
  }

  init(name: string) {
    return new SpaceChat().setSpace(this.space_id).setName(name);
  }

  async list() {
    // todo edit to avoid multiple db queries
    const raw_chats = (await db.execute("SELECT id FROM chats WHERE space_id = ?", [this.space_id], { prepare: true })).rows;
    const chats: (SpaceChat | null)[] = [];

    for (const { id } of raw_chats) {
      chats.push(await SpaceChat.getById(id));
    }

    return chats.filter(Boolean) as SpaceChat[];
  }
}

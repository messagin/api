import { Space } from "../models/Space";
import db from "../utils/database";

export class SpaceManager {
  private user_id: string;

  constructor(user_id: string) {
    this.user_id = user_id;
  }

  create(name: string) {
    return new Space().setName(name).create();
  }

  async list() {
    const raw_spaces = await db.members.select("space_id").where({ user_id: this.user_id });
    const spaces: (Space | null)[] = [];

    for (const { space_id } of raw_spaces) {
      spaces.push(await Space.getById(space_id));
    }

    return spaces.filter(Boolean) as Space[];
  }
}

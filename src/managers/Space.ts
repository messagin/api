import { Space } from "../schemas/Space";
import db from "../utils/database";

export class SpaceManager {
  private user_id: string;

  constructor(user_id: string) {
    this.user_id = user_id;
  }

  init(name: string) {
    return new Space().setName(name).setOwner(this.user_id);
  }

  async list() {
    const spaces = await db.spaces
      .join("members", "spaces.id", "=", "members.space_id")
      .select("spaces.*")
      .where("members.user_id", this.user_id);

    return spaces.map(space => new Space(space.id, space.created_at)
      .setName(space.name)
      .setOwner(space.owner_id)
    );
  }
}

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
    const spaces = [];
    const member_entries = await db.selectFrom("members", ["space_id"], { user_id: this.user_id });
    for (const member_entry of member_entries) {
      const space = await db.selectOneFrom("spaces", "*", { id: member_entry.space_id });
      if (!space) continue;
      spaces.push(space);
    }

    // const spaces = await db.spaces
    //   .join("members", "spaces.id", "=", "members.space_id")
    //   .select("spaces.*")
    //   .where("members.user_id", this.user_id);

    return spaces.map(space => new Space(space.id, space.created_at)
      .setFlags(space.flags)
      .setName(space.name)
      .setOwner(space.owner_id)
    ).filter(space => !space.hasFlag("Deleted"));
  }
}

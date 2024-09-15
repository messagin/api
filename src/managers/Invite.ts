import { Invite } from "../schemas/Invite";
import db from "../utils/database";

export class InviteManager {
  private space_id: string;

  constructor(space_id: string) {
    this.space_id = space_id;
  }

  create() {
    return new Invite().setSpace(this.space_id).create();
  }

  async list(): Promise<Invite[]> {
    const invites = (await db.execute("SELECT * FROM invites WHERE space_id = ?", [this.space_id], { prepare: true })).rows;

    return invites.map(invite => new Invite(invite.id, invite.created_at)
      .setMaxAge(invite.max_age)
      .setMaxUses(invite.max_uses)
      .setSpace(invite.space_id)
      .setUses(invite.uses)
    );
  }
}

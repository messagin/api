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

  async list() {
    const raw_invites = await db.selectFrom("invites", ["id"], { space_id: this.space_id });
    const invites: (Invite | null)[] = [];

    for (const { id } of raw_invites) {
      invites.push(await Invite.getById(id));
    }

    return invites.filter(Boolean) as Invite[];
  }
}

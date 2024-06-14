import { Member } from "../schemas/Member";
import db from "../utils/database";

export class MemberManager {
  private space_id: string;

  constructor(space_id: string) {
    this.space_id = space_id;
  }

  init(user_id: string) {
    return new Member()
      .setSpace(this.space_id)
      .setUser(user_id);
  }

  async get(user_id: string) {
    const member = await db.members.where({ space_id: this.space_id, user_id: user_id }).first();
    if (!member) return null;
    return new Member(member.created_at)
      .setColor(member.color)
      .setPermissions(member.permissions)
      .setSpace(member.space_id)
      .setUser(member.user_id);
  }

  async list() {
    const members = await db.members.where({ space_id: this.space_id });

    return members.map(member => new Member()
      .setSpace(member.space_id)
      .setUser(member.user_id)
      .setPermissions(member.permissions)
      .setColor(member.color)
    );
  }

  async has(user_id: string) {
    const member = await db.members.where({ space_id: this.space_id, user_id }).first();
    if (!member) return false;
    return true;
  }
}

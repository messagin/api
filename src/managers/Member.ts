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
    const member = (await db.execute("SELECT * FROM members WHERE space_id = ? AND user_id = ? LIMIT 1", [this.space_id, user_id])).rows[0];
    if (!member) return null;
    return new Member(member.created_at)
      .setColor(member.color)
      .setPermissions(member.permissions)
      .setSpace(member.space_id)
      .setUser(member.user_id);
  }

  async list(): Promise<Member[]> {
    const members = (await db.execute("SELECT * FROM members WHERE space_id = ?", [this.space_id], { prepare: true })).rows;

    return members.map(member => new Member()
      .setSpace(member.space_id)
      .setUser(member.user_id)
      .setPermissions(member.permissions)
      .setColor(member.color)
    );
  }

  async has(user_id: string) {
    const member = (await db.execute("SELECT * FROM members WHERE space_id = ? AND user_id = ? LIMIT 1", [this.space_id, user_id], { prepare: true })).rows;
    if (!member) return false;
    return true;
  }
}

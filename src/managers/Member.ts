import { Member } from "../models/Member";
import db from "../utils/database";

export class MemberManager  {
  private space_id: string;

  constructor(space_id: string) {
    this.space_id = space_id;
  }

  create(user_id: string) {
    return new Member()
      .setSpace(this.space_id)
      .setUser(user_id)
      .create();
  }

  async list() {
    const raw_members = await db.members.select().where({ space_id: this.space_id });
    const members: (Member | null)[] = [];

    for (const raw_member of raw_members) {
      const member = new Member()
        .setSpace(raw_member.space_id)
        .setUser(raw_member.user_id)
        .setRawPermissions(raw_member.permissions)
        .setColor(raw_member.color);
      members.push(member);
    }
    return members.filter(Boolean) as Member[];
  }

  async has(user_id: string) {
    const member = await db.members.where({ space_id: this.space_id, user_id }).first();
    if (!member) return false;
    return true;
  }
}

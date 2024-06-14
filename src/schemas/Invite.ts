import { generateIDv2 } from "../utils/auth.node";
import db from "../utils/database";

interface BaseInvite {
  id: string;
  space_id: string;
  uses: number;
  max_uses: number;
  max_age: number;
  created_at: number;
};

export class Invite implements BaseInvite {
  id: string;
  space_id: string;
  uses: number;
  max_uses: number;
  max_age: number;
  created_at: number;

  constructor(id?: string, time?: number) {
    this.id = id ?? generateIDv2();
    this.space_id = "";
    this.uses = 0;
    this.max_uses = 0;
    this.max_age = 86400; // 1 day
    this.created_at = time ?? Date.now();
  }

  setSpace(id: string) {
    this.space_id = id;
    return this;
  }

  setUses(uses: number) {
    this.uses = uses;
    return this;
  }

  setMaxUses(max_uses: number) {
    this.max_uses = max_uses;
    return this;
  }

  setMaxAge(max_age: number) {
    this.max_age = max_age;
    return this;
  }

  static async getById(id: string) {
    const invite = await db.invites.where({ id }).first();
    if (!invite) return null;
    return new Invite(invite.id, invite.created_at)
      .setMaxAge(invite.max_age)
      .setMaxUses(invite.max_uses)
      .setSpace(invite.space_id)
      .setUses(invite.uses);
  }

  static async exists(id: string) {
    const count = await db.invites.where({ id }).count().first() as { "count(*)": number };
    return count["count(*)"] > 0;
  }

  // todo review the Invite.update function
  async update() {
    const uses = this.uses + 1;
    if (this.max_uses === 0 || uses < this.max_uses) {
      await db.invites.update({ uses }).where({ id: this.id });
    } else {
      await db.invites.delete().where({ id: this.id });
    }
    return this;
  }

  async create() {
    await db.invites.insert({
      id: this.id,
      space_id: this.space_id,
      uses: this.uses,
      max_uses: this.max_uses,
      max_age: this.max_age,
      created_at: this.created_at
    });
    return this;
  }

  async destroy() {
    await db.invites.delete().where({
      id: this.id
    });
    return this;
  }
}

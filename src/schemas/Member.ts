import db from "../utils/database";

const Permissions = {
  Admin: 1 << 0
}

type Permission = keyof typeof Permissions;

interface BaseMember {
  space_id: string;
  user_id: string;
  share: number;
  permissions: number;
  color: number | null;
  created_at: number;
}

type CleanMember = Omit<BaseMember, "share">;

export class Member implements BaseMember {
  space_id: string;
  user_id: string;
  share: number;
  permissions: number;
  color: number | null;
  created_at: number;

  constructor(time?: number) {
    this.space_id = "";
    this.user_id = "";
    this.permissions = 0;
    this.share = 0;
    this.color = 0;
    this.created_at = time ?? Date.now();

    return this;
  }

  setSpace(id: string) {
    this.space_id = id;
    return this;
  }

  setUser(id: string) {
    this.user_id = id;
    return this
  }

  setPermissions(permissions: number) {
    this.permissions = permissions;
    return this;
  }

  setPermission(permission: Permission) {
    this.permissions |= Permissions[permission];
    // todo track updated entries (Member)
    return this;
  }

  clearPermission(permission: Permission) {
    this.permissions &= ~Permissions[permission];
    return this;
  }

  hasPermission(perm: Permission) {
    return (this.permissions & Permissions[perm]) !== 0;
  }

  setColor(color: number | null) {
    this.color = color;
    return this;
  }

  clean(): CleanMember {
    return {
      permissions: this.permissions,
      user_id: this.user_id,
      space_id: this.space_id,
      color: this.color,
      created_at: this.created_at
    }
  }

  async create() {
    await db.members.insert({
      user_id: this.user_id,
      space_id: this.space_id,
      permissions: this.permissions,
      color: this.color,
      created_at: this.created_at
    });
    return this;
  }

  async delete() {
    await db.memberRoles.delete().where({ user_id: this.user_id, space_id: this.space_id });
    await db.members.delete().where({ user_id: this.user_id, space_id: this.space_id });
    return this;
  }

  static async exists(id: string, space_id: string) {
    const count = await db.members.where({ user_id: id, space_id: space_id }).count().first() as { "count(*)": number };
    return count["count(*)"] > 0;
  }

  static async get(space_id: string, user_id: string) {
    const member = await db.members.where({ space_id, user_id }).first();
    if (!member) return null;
    return new Member(member.created_at)
      .setPermissions(member.permissions)
      .setColor(member.color)
      .setSpace(member.space_id)
      .setUser(member.user_id);
  }
}

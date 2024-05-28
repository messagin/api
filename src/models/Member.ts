import db from "../utils/database";

const Permissions = {
  Admin: 1 << 0
}

type Permission = keyof typeof Permissions;

interface BaseMember {
  space_id: string;
  user_id: string;
  rawPermissions: number;
  color: number | null;
}

export class Member implements BaseMember {
  space_id: string;
  user_id: string;
  rawPermissions: number;
  color: number | null;

  constructor() {
    this.space_id = "";
    this.user_id = "";
    this.rawPermissions = 0;
    this.color = 0;

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

  setRawPermissions(permissions: number) {
    this.rawPermissions = permissions;
    return this;
  }

  setPermissions(...flags: Permission[]) {
    let permissions = 0;
    for (const flag of flags) {
      permissions |= Permissions[flag];
    }
    this.rawPermissions = permissions;
    return this;
  }

  setColor(color: number | null) {
    this.color = color;
    return this;
  }

  clean() {
    return {
      permissions: this.rawPermissions,
      user_id: this.user_id,
      space_id: this.space_id,
      color: this.color
    }
  }

  get permissions() {
    const result: { [K in Permission]: boolean } = (Object.keys(Permissions) as Permission[])
      .reduce((acc, flag) => {
        acc[flag] = !!(Permissions[flag] & this.rawPermissions)
        return acc;
      }, {} as { [K in Permission]: boolean });
    return result;
  }

  async create() {
    await db.members.insert({
      user_id: this.user_id,
      space_id: this.space_id,
      permissions: this.rawPermissions,
      color: this.color
    });
    return this;
  }
}

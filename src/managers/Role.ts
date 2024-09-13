import { Role } from "../schemas/Role";
import db from "../utils/database";

export class RoleManager {
  private space_id: string;

  constructor(space_id: string) {
    this.space_id = space_id;
  }

  init(name: string) {
    // todo set default permissions
    return new Role()
      .setPermissions(0)
      .setSpace(this.space_id)
      .setName(name);
  }

  async list() {
    const roles = (await db.execute("SELECT * FROM roles WHERE space_id = ?", [this.space_id], { prepare: true })).rows;

    return roles.map(role => new Role(role.id, role.created_at)
      .setName(role.name)
      .setPermissions(role.permissions)
      .setFlags(role.flags)
    );
  }
}

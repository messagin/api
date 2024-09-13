import { generateIDv2 } from "../utils/auth.node";
import db from "../utils/database";

const Permissions = {
  Admin: 1 << 0,
} as const;

type Permission = keyof typeof Permissions;

const RoleFlags = {
  Deleted: 1 << 0,
} as const;

type RoleFlag = keyof typeof RoleFlags;

interface ApiRole {
  id: string;
  space_id: string;
  flags: number;
  permissions: number;
  created_at: string;
};

export class Role implements ApiRole {
  id: string;
  space_id: string;
  flags: number;
  permissions: number;
  created_at: string;
  
  constructor(id?: string, time?: string) {
    this.id = id ?? generateIDv2();
    this.space_id = "";
    this.flags = 0;
    this.permissions = 0;
    this.created_at = time ?? new Date().toISOString();
  }
  
  setSpace(id: string) {
    this.space_id = id;
    return this;
  }
  
  setPermissions(permissions: number) {
    this.permissions = permissions;
    return this;
  }
  
  setPermission(permission: Permission) {
    this.permissions |= Permissions[permission];
    return this;
  }
  
  clearPermission(permission: Permission) {
    this.permissions &= ~Permissions[permission];
    return this;
  }
  
  hasPermission(permission: Permission) {
    return (this.permissions & Permissions[permission]) !== 0;
  }
  
  setFlags(flags: number) {
    this.flags = flags;
    return this;
  }
  
  setFlag(flag: RoleFlag) {
    this.flags |= RoleFlags[flag];
    return this;
  }
  
  clearFlag(flag: RoleFlag) {
    this.flags &= ~RoleFlags[flag];
    return this;
  }
  
  hasFlag(flag: RoleFlag) {
    return (this.flags & RoleFlags[flag]) !== 0;
  }
  
  async create() {
    await db.execute("INSERT INTO roles (id,space_id,permissions,flags,created_at) VALUES (?,?,?,?,?)", [this.id, this.space_id, this.permissions, this.flags, this.created_at], { prepare: true });
    return this;
  }
  
  static async get(id: string, space_id: string) {
    const role = (await db.execute("SELECT * FROM roles WHERE id = ? AND space_id = ? LIMIT 1", [id, space_id], { prepare: true })).rows[0];
    if (!role) return null;
    return new Role(role.id, role.created_at)
      .setPermissions(role.permissions)
      .setFlags(role.flags)
      .setSpace(role.space_id);
  }
}

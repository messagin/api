import { generateIDv2 } from "../utils/auth";
import db from "../utils/database";
import { ChatManager } from "../managers/Chat";
import { RoleManager } from "../managers/Role";
import { MemberManager } from "../managers/Member"
import { InviteManager } from "../managers/Invite";

const SpaceFlags = {
  Deleted: 1 << 0,
} as const;

type SpaceFlag = keyof typeof SpaceFlags;

interface BaseSpace {
  id: string;
  name: string;
  flags: number;
  owner_id: string;
};

export class Space implements BaseSpace {
  id: string;
  name: string;
  flags: number;
  owner_id: string;

  constructor(id?: string) {
    this.id = id ?? generateIDv2();
    this.name = "";
    this.flags = 0;
    this.owner_id = "";
  }

  setName(name: string) {
    this.name = name;
    return this;
  }

  setOwner(id: string) {
    this.owner_id = id;
    return this;
  }


  setFlag(flag: SpaceFlag) {
    this.flags |= SpaceFlags[flag];
    return this;
  }

  clearFlag(flag: SpaceFlag) {
    this.flags &= ~SpaceFlags[flag];
    return this;
  }

  hasFlag(flag: SpaceFlag) {
    return (this.flags & SpaceFlags[flag]) !== 0;
  }

  setFlags(flags: number) {
    this.flags = flags;
    return this;
  }

  static async getById(id: string): Promise<Space | null> {
    const space = (await db.execute("SELECT * FROM spaces WHERE id = ?", [id], { prepare: true })).rows[0];
    if (!space) return null;
    return new Space(space.id)
      .setName(space.name)
      .setOwner(space.owner_id);
  }

  async create() {
    await db.execute("INSERT INTO spaces (id,name,flags,owner_id) VALUES (?,?,?,?)", [this.id, this.name, this.flags, this.owner_id], { prepare: true });
    return this;
  }

  async update() {
    await db.execute("UPDATE spaces SET name = ?, flags = ?, owner_id = ?, WHERE id = ?", [
      this.name,
      this.flags,
      this.owner_id,
      this.id
    ], { prepare: true });
    return this;
  }

  async delete() {
    //! only mark as deleted
    this.setFlag("Deleted");
    this.update();

    // for (const member of await this.members.list()) {
    //   // this will also delete memberRoles
    //   await member.delete();
    // }
    // for (const chat of await this.chats.list()) {
    //   // this will also delete messages
    //   await chat.delete();
    // }
    // // todo delete roles on space delete
    // await db.spaces.delete().where({ id: this.id });
    return this;
  }

  static async exists(id: string) {
    const count = (await db.execute("SELECT count(*) FROM spaces WHERE id = ?", [id], { prepare: true })).rows[0].count.low;
    return count > 0;
  }

  get chats() {
    return new ChatManager(this.id);
  }

  get members() {
    return new MemberManager(this.id);
  }

  get invites() {
    return new InviteManager(this.id);
  }

  get roles() {
    return new RoleManager(this.id);
  }
}

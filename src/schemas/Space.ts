import { generateIDv2 } from "../utils/auth.node";
import db from "../utils/database";
import { ChatManager } from "../managers/Chat";
import { MemberManager } from "../managers/Member"
import { InviteManager } from "../managers/Invite";

const SpaceFlags = {
  Deleted: 1 << 0,
};

type SpaceFlag = keyof typeof SpaceFlags;


interface BaseSpace {
  id: string;
  name: string;
  flags: number;
  owner_id: string;
  created_at: number;
};

export class Space implements BaseSpace {
  id: string;
  name: string;
  flags: number;
  owner_id: string;
  created_at: number;

  constructor(id?: string, time?: number) {
    this.id = id ?? generateIDv2();
    this.name = "";
    this.flags = 0;
    this.owner_id = "";
    this.created_at = time ?? Date.now();
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

  static async getById(id: string) {
    const space = await db.spaces.where({ id }).first();
    if (!space) return null;
    return new Space(space.id, space.created_at)
      .setName(space.name)
      .setOwner(space.owner_id);
  }

  async create() {
    await db.spaces.insert({
      id: this.id,
      name: this.name,
      flags: this.flags,
      owner_id: this.owner_id,
      created_at: this.created_at
    });
    return this;
  }

  async update() {
    await db.spaces.update({
      name: this.name,
      flags: this.flags,
      owner_id: this.owner_id,
      created_at: this.created_at
    }).where({ id: this.id });
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
    const count = await db.spaces.where({ id }).count().first() as { "count(*)": number };
    return count["count(*)"] > 0;
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

  // get roles() {
  //   return new RoleManager(this.id);
  // }
}

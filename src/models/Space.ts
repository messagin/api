import { generateIDv2 } from "../utils/auth.node";
import db from "../utils/database";
import { ChatManager } from "../managers/Chat";
import { MemberManager } from "../managers/Member"

interface BaseSpace {
  id: string;
  name: string;
  owner_id: string;
};

export class Space implements BaseSpace {
  id: string;
  name: string;
  owner_id: string;

	constructor(id?: string) {
		this.id = id ?? generateIDv2();
    this.name = "";
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

	static async getById(id: string) {
		const space = await db.spaces.where({ id }).first();
		if (!space) return null;
		return new Space(space.id)
      .setName(space.name)
      .setOwner(space.owner_id);
	}

	async create() {
		await db.spaces.insert({
      id: this.id,
      name: this.name,
      owner_id: this.owner_id
		})
		return this;
	}

  async delete() {
    await db.memberRoles.delete().where({ space_id: this.id });
    await db.members.delete().where({ space_id: this.id });
    await db.roles.delete().where({ space_id: this.id });
    for (const chat of await this.chats.list()) {
      await chat.delete();
    }
    return this;
  }

  get chats() {
    return new ChatManager(this.id);
  }

  get members() {
    return new MemberManager(this.id);
  }

  // get roles() {
  //   return new RoleManager(this.id);
  // }
}

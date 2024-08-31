import db from "../utils/database";

interface BaseRelation {
  user_id0: string;
  user_id1: string;
  flags: number;
  updated_at: number;
  created_at: number;
}

const RelationFlags = {
  // Pending: 0
  Accepted: 1 << 0,
  Blocked0: 1 << 1,
  Blocked1: 1 << 2
} as const;

type RelationFlag = keyof typeof RelationFlags;

type CleanRelation = Omit<BaseRelation, "user_id0" | "user_id1"> & {
  user_id: string;
  friend_id: string;
}

export class Relation implements BaseRelation {
  user_id0: string;
  user_id1: string;
  flags: number;
  updated_at: number;
  created_at: number;

  constructor(time?: number) {
    this.user_id0 = "";
    this.user_id1 = "";
    this.flags = 0;
    this.updated_at = 0;
    this.created_at = time ?? Date.now();

    return this;
  }

  setUser0(id: string) {
    this.user_id0 = id;
    return this;
  }

  setUser1(id: string) {
    this.user_id1 = id;
    return this;
  }

  private setUpdatedAt(time: number) {
    this.updated_at = time;
    return this;
  }

  private setFlags(flags: number) {
    this.flags = flags;
    return this;
  }

  setFlag(flag: RelationFlag) {
    this.flags |= RelationFlags[flag];
    return this;
  }

  clearFlag(flag: RelationFlag) {
    this.flags |= RelationFlags[flag];
    return this;
  }

  clean(user_id: string): CleanRelation {
    return {
      // todo clean relation flags (blocked)
      flags: this.flags,
      updated_at: this.updated_at,
      created_at: this.created_at,
      user_id: user_id,
      friend_id: this.user_id0 == user_id ? this.user_id1 : this.user_id0
    }
  }

  async create() {
    await db.execute("INSERT INTO relations (user_id0,user_id1,flags,updated_at,created_at) VALUES (?,?,?,?,?)", [this.user_id0, this.user_id1, this.flags, this.updated_at, this.created_at]);
    return this;
  }

  static async getByIds(id0: string, id1: string) {
    const relation = (await db.execute("SELECT * FROM relations WHERE (user_id0 = ? AND user_id1 = ?) OR (user_id0 = ? AND user_id1 = ?) LIMIT 1", [id0, id1, id1, id0])).rows[0];

    if (!relation) return null;
    return new Relation(relation.created_at)
      .setUser0(relation.user_id0)
      .setUser1(relation.user_id1)
      .setFlags(relation.flags)
      .setUpdatedAt(relation.updated_at);
  }

  async delete(id0: string, id1: string) {
    await db.deleteFrom("relations", "*", { user_id0: id0, user_id1: id1 });
    await db.deleteFrom("relations", "*", { user_id0: id1, user_id1: id0 });
    // await db.relations.delete()
    //   .where({ user_id0: id0, user_id1: id1 })
    //   .orWhere({ user_id0: id1, user_id1: id0 });
    return this;
  }


}

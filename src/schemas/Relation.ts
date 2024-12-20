import db from "../utils/database";

const RelationFlags = {
  Pending0: 1 << 0, // <- direction
  Pending1: 1 << 1, // -> direction
  Accepted: 1 << 2,
  Blocked0: 1 << 3, // <- direction
  Blocked1: 1 << 4, // -> direction
} as const;

interface BaseRelation {
  user_id0: string;
  user_id1: string;
  flags: number;
  updated_at: string | null;
  created_at: string;
}

type RelationFlag = keyof typeof RelationFlags;

type CleanRelation = Omit<BaseRelation, "user_id0" | "user_id1"> & {
  user_id: string;
  friend_id: string;
}

export class Relation implements BaseRelation {
  user_id0: string;
  user_id1: string;
  flags: number;
  updated_at: string | null;
  created_at: string;

  constructor(time?: string) {
    this.user_id0 = "";
    this.user_id1 = "";
    this.flags = 0;
    this.updated_at = null;
    this.created_at = time ?? new Date().toISOString();

    return this;
  }

  setUsers(id0: string, id1: string) {
    if (id0 < id1) {
      this.setFlag("Pending0");
      this.user_id0 = id0;
      this.user_id1 = id1;
    }
    else {
      this.setFlag("Pending1");
      this.user_id0 = id1;
      this.user_id1 = id0;
    }
    return this;
  }

  setUpdatedAt(time: string) {
    this.updated_at = time;
    return this;
  }

  setFlags(flags: number) {
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

  hasFlag(flag: RelationFlag) {
    return (this.flags & RelationFlags[flag]) !== 0;
  }

  private cleanFlags() {
    return this.flags & ~(RelationFlags["Blocked0"] | RelationFlags["Blocked1"]);
  }

  clean(user_id: string): CleanRelation {
    return {
      flags: this.cleanFlags(),
      updated_at: this.updated_at,
      created_at: this.created_at,
      user_id: user_id,
      friend_id: this.user_id0 == user_id ? this.user_id1 : this.user_id0
    }
  }

  async create() {
    await db.execute("INSERT INTO relations (user_id0,user_id1,flags,updated_at,created_at) VALUES (?,?,?,?,?)", [this.user_id0, this.user_id1, this.flags, this.updated_at, this.created_at], { prepare: true });
    return this;
  }

  static async getByIds(id0: string, id1: string): Promise<Relation | null> {
    const relation = (await db.execute("SELECT * FROM relations WHERE user_id0 = ? AND user_id1 = ? LIMIT 1", [id0, id1], { prepare: true })).rows[0];

    if (!relation) return null;
    return new Relation(relation.created_at)
      .setUsers(relation.user_id0, relation.user_id1)
      .setFlags(relation.flags)
      .setUpdatedAt(relation.updated_at);
  }

  async delete() {
    await db.execute("DELETE FROM relations WHERE user_id0 = ? AND user_id1 = ?", [this.user_id0, this.user_id1], { prepare: true });
    return this;
  }
}

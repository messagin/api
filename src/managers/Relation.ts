import { Relation } from "../schemas/Relation";
import db from "../utils/database";

export class RelationManager {
  private user_id: string;

  constructor(user_id: string) {
    this.user_id = user_id;
  }

  init(id: string) {
    return new Relation().setUsers(this.user_id, id);
  }

  async list() {
    const relations0 = (await db.execute("SELECT * FROM relations WHERE user_id0 = ?", [this.user_id], { prepare: true })).rows;
    const relations1 = (await db.execute("SELECT * FROM relations WHERE user_id1 = ?", [this.user_id], { prepare: true })).rows;
    return [
      ...relations0.map(x => new Relation(x.created_at).setUsers(x.user_id0, x.user_id1).setFlags(x.flags).setUpdatedAt(x.updated_at)),
      ...relations1.map(x => new Relation(x.created_at).setUsers(x.user_id0, x.user_id1).setFlags(x.flags).setUpdatedAt(x.updated_at))
    ];
  }
}

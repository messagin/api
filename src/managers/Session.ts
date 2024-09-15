import { Request } from "express";
import { Session } from "../schemas/Session";
import db from "../utils/database";

export class SessionManager {
  private id: string;

  constructor(id: string) {
    this.id = id;
  }

  create(req: Request) {
    return new Session()
      .setUser(this.id)
      .create(req);
  }

  async list() {
    const sessions = (await db.execute("SELECT * FROM messagin.sessions WHERE user_id = ?", [this.id], { prepare: true })).rows;

    return sessions.map(session => new Session
      (
        session.id,
        session.created_at,
      )
      .setBrowser(session.browser)
      .setFlags(session.flags)
      .setToken(session.token_)
      .setOS(session.os)
      .setUA(session.ua)
      .setIP(session.ip));
  }
}

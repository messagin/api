import { Request } from "express";
import { Session } from "../schemas/Session";
import db from "../utils/database";

export class SessionManager {
  private id: string;

  constructor(id: string) {
    this.id = id;
  }

  create(req: Request) {
    return new Session(this.id).create(req);
  }

  async list() {
    const raw_sessions = await db.selectFrom("sessions", ["id"], { user_id: this.id });
    const sessions: (Session | null)[] = []

    for (const { id } of raw_sessions) {
      sessions.push(await Session.getById(id));
    }

    return sessions.filter(Boolean) as Session[];
  }
}

import { Request } from "express";
import { generateIDv2, generateToken } from "../utils/auth";
import db from "../utils/database";
import { UAParser } from "ua-parser-js";

const SessionFlags = {
  Bot: 1 << 0,
};

type SessionFlag = keyof typeof SessionFlags;

interface BaseSession {
  id: string;
  user_id: string;
  flags: number;
  token: { key: string, string: string, hash: string };
  os: string | null;
  ip: string | null;
  ua: string | null;
  browser: string | null;
  updated_at: number;
  created_at: number;
};

type CleanSession = Omit<BaseSession, "token" | "user_id">;

export class Session implements BaseSession {
  id: string;
  user_id: string;
  flags: number;
  token: { key: string, string: string, hash: string };
  os: string | null;
  ip: string | null;
  ua: string | null;
  browser: string | null;
  updated_at: number;
  created_at: number;

  constructor(user_id: string, id?: string, updated_at?: number, created_at?: number) {
    this.id = id ?? generateIDv2();
    this.user_id = user_id;
    this.flags = 0;
    this.token = { hash: "", key: "", string: "" };
    this.os = null;
    this.ip = null;
    this.ua = null;
    this.browser = null;
    this.updated_at = updated_at ?? Date.now();
    this.created_at = created_at ?? Date.now();
  }

  setBrowser(browser: string | null) {
    this.browser = browser;
    return this;
  }

  setIP(ip: string | null) {
    this.ip = ip;
    return this;
  }

  setOS(os: string | null) {
    this.os = os;
    return this;
  }

  setUA(ua: string | null) {
    this.ua = ua;
    return this;
  }

  setFlag(flag: SessionFlag) {
    this.flags |= SessionFlags[flag];
    return this;
  }

  clearFlag(flag: SessionFlag) {
    this.flags &= ~SessionFlags[flag];
    return this;
  }

  hasFlag(flag: SessionFlag) {
    return (this.flags & SessionFlags[flag]) !== 0;
  }

  private setFlags(flags: number) {
    this.flags = flags;
    return this;
  }

  private setToken(token: string) {
    this.token.hash = token;
    return this;
  }

  setCreatedAt(time?: number) {
    this.created_at = time ?? Date.now();
    return this;
  }

  setUpdatedAt(time?: number) {
    this.updated_at = time ?? Date.now();
    return this;
  }

  clean(): CleanSession {
    return {
      id: this.id,
      flags: this.flags,
      created_at: this.created_at,
      updated_at: this.updated_at,
      ip: this.ip,
      ua: this.ua,
      browser: this.browser,
      os: this.os,
    };
  }

  async create(req: Request) {
    const result = new UAParser(req.headers["user-agent"]).getResult();
    this.setBrowser(result.browser.name ?? null)
      .setOS(result.os.name ?? null)
      .setUA(result.ua)
      .setFlags(0)
      .setIP(req.ip ?? null);

    this.token = generateToken(this.id);

    await db.insertInto("sessions", {
      id: this.id,
      user_id: this.user_id,
      token: this.token.hash,
      flags: this.flags,
      ip: this.ip,
      os: this.os,
      ua: this.ua,
      browser: this.browser,
      created_at: this.created_at,
      updated_at: this.updated_at,
    });
    return this;
  }

  async update() {
    await db.update("sessions", {
      updated_at: this.updated_at
    }, { id: this.id });
    return this;
  }

  static async getById(id: string) {
    const session = await db.selectOneFrom("sessions", "*", { id })
    // const session = await db.sessions.where({ id }).first();
    if (!session) return null;
    return new Session
      (
        session.user_id,
        session.id,
        session.updated_at,
        session.created_at,
      )
      .setBrowser(session.browser)
      .setFlags(session.flags)
      .setToken(session.token)
      .setOS(session.os)
      .setUA(session.ua)
      .setIP(session.ip);
  }

  // todo check if Session.exists(id) is required
  // static async exists(id: string) {
  //   const count = await db.sessions.where({ id }).count().first() as { "count(*)": number };
  //   return count["count(*)"] > 0;
  // }

  async delete() {
    await db.deleteFrom("sessions", "*", { id: this.id });
    return this;
  }
}

import { Request } from "express";
import { generateIDv2, generateToken } from "../utils/auth";
import db from "../utils/database";
import { UAParser } from "ua-parser-js";

const SessionFlags = {
  Bot: 1 << 0,
} as const;

type SessionFlag = keyof typeof SessionFlags;

interface BaseSession {
  id: string;
  user_id: string | null;
  flags: number;
  token: { key: string, string: string, hash: string };
  os: string | null;
  ip: string | null;
  ua: string | null;
  browser: string | null;
  updated_at: string | null;
  created_at: string;
};

type CleanSession = Omit<BaseSession, "token" | "user_id">;

export class Session implements BaseSession {
  id: string;
  user_id: string | null;
  flags: number;
  token: { key: string, string: string, hash: string };
  os: string | null;
  ip: string | null;
  ua: string | null;
  browser: string | null;
  updated_at: string | null;
  created_at: string;

  constructor(id?: string, created_at?: string) {
    this.id = id ?? generateIDv2();
    this.user_id = "";
    this.flags = 0;
    this.token = { hash: "", key: "", string: "" };
    this.os = null;
    this.ip = null;
    this.ua = null;
    this.browser = null;
    this.updated_at = null;
    this.created_at = created_at ?? new Date().toISOString();
  }

  setUser(id: string) {
    this.user_id = id;
    return this;
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

  setFlags(flags: number) {
    this.flags = flags;
    return this;
  }

  setToken(token: string) {
    this.token.hash = token;
    return this;
  }

  setUpdatedAt(time?: string) {
    this.updated_at = time ?? new Date().toISOString();
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

    await db.execute("INSERT INTO sessions (id,user_id,token_,flags,ip,os,ua,browser,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)", [this.id, this.user_id, this.token.hash, this.flags, this.ip, this.os, this.ua, this.browser, this.created_at, this.updated_at], { prepare: true });
    return this;
  }

  async update() {
    await db.execute("UPDATE sessions SET updated_at = ? WHERE id = ?", [this.updated_at, this.id], { prepare: true });
    return this;
  }

  static async getById(id: string): Promise<Session | null> {
    const session = (await db.execute("SELECT * FROM sessions WHERE id = ?", [id], { prepare: true })).rows[0];
    if (!session) return null;
    return new Session
      (
        session.id,
        session.created_at,
      )
      .setUpdatedAt(session.updated_at)
      .setBrowser(session.browser)
      .setFlags(session.flags)
      .setToken(session.token_)
      .setUser(session.user_id)
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
    await db.execute("DELETE FROM sessions WHERE id = ?", [this.id], { prepare: true });
    return this;
  }
}

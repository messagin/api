import { Request } from "express";
import { generateIDv2, generateToken } from "../utils/auth";
import db from "../utils/database";
import { UAParser } from "ua-parser-js";

const SessionFlags = {
  Bot: 1 << 0,
}

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
  timestamp: number;
}

export class Session implements BaseSession {
  id: string;
  user_id: string;
  flags: number;
  token: { key: string, string: string, hash: string };
  os: string | null;
  ip: string | null;
  ua: string | null;
  browser: string | null;
  timestamp: number;

  constructor(user_id: string, id?: string) {
    this.id = id ?? generateIDv2();
    this.user_id = user_id;
    this.flags = 0;
    this.token = { hash: "", key: "", string: "" };
    this.os = null;
    this.ip = null;
    this.ua = null;
    this.browser = null;
    this.timestamp = Date.now();
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

  setFlags(...flags: SessionFlag[]) {
    let bitfield = 0;
    for (const flag of flags) {
      bitfield |= SessionFlags[flag];
    }
    this.flags = bitfield;
    return this;
  }

  setRawFlags(flags: number) {
    this.flags = flags;
    return this;
  }

  setRawToken(token: string) {
    this.token.hash = token;
    return this;
  }

  setTimestamp(timestamp?: number) {
    this.timestamp = timestamp ?? Date.now();
    return this;
  }

  clean() {
    return {
      id: this.id,
      flags: this.flags,
      timestamp: this.timestamp,
      ip: this.ip,
      ua: this.ua,
      browser: this.browser,
      os: this.os,
    };
  }

  get Flags() {
    const result: { [K in SessionFlag]: boolean } = (Object.keys(SessionFlags) as SessionFlag[])
      .reduce((acc, flag) => {
        acc[flag] = !!(SessionFlags[flag] & this.flags);
        return acc;
      }, {} as { [K in SessionFlag]: boolean });
    return result;
  }

  async create(req: Request) {
    const result = new UAParser(req.headers["user-agent"]).getResult();
    this.setBrowser(result.browser.name ?? null)
      .setOS(result.os.name ?? null)
      .setUA(result.ua)
      .setRawFlags(0)
      .setIP(req.ip ?? null);

    this.token = generateToken(this.id);

    await db.sessions.insert({
      id: this.id,
      user_id: this.user_id,
      token: this.token.hash,
      flags: this.flags,
      ip: this.ip,
      os: this.os,
      ua: this.ua,
      browser: this.browser,
      timestamp: this.timestamp,
    });
    return this;
  }

  async update() {
    await db.sessions.update({
      timestamp: this.timestamp
    }).where({ id: this.id });
    return this;
  }

  static async getById(id: string) {
    const session = await db.sessions.where({ id }).first();
    if (!session) return null;
    return new Session(session.user_id, session.id)
      .setBrowser(session.browser)
      .setRawFlags(session.flags)
      .setRawToken(session.token)
      .setOS(session.os)
      .setUA(session.ua)
      .setIP(session.ip)
      .setTimestamp(session.timestamp);
  }

  async delete() {
    // no await, perform delete in the background
    db.sessions.delete().where({ id: this.id });
    return this;
  }
}

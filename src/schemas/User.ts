import { generateHmac, generateIDv2 } from "../utils/auth";
import { SessionManager } from "../managers/Session";
import { SpaceManager } from "../managers/Space";
import db from "../utils/database";
import { ChatManager } from "../managers/Chat";

const UserFlags = {
  Admin: 1 << 0,
  MfaEnabled: 1 << 1,
  Bot: 1 << 2,
  UnverifiedEmail: 1 << 3,
};

type UserFlag = keyof typeof UserFlags;

interface BaseUser {
  id: string;
  flags: number;
  username: string;
  password: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  mfa: string | null;
  created_at: number;
}

type CleanUser = Omit<BaseUser, "password" | "mfa">;
type PublicUser = Omit<CleanUser, "phone" | "email">;

export class User implements BaseUser {
  id: string;
  flags: number;
  username: string;
  password: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  mfa: string | null;
  created_at: number;

  private updatedEntries?: (keyof BaseUser)[];

  constructor(id?: string, time?: number) {
    this.id = id ?? generateIDv2();
    this.flags = 0;
    this.username = "";
    this.password = "";
    this.name = null;
    this.email = null;
    this.phone = null;
    this.mfa = null;
    this.created_at = time ?? Date.now();

    this.updatedEntries = [];
  }

  async create() {
    await db.users.insert({
      id: this.id,
      flags: this.flags,
      username: this.username,
      password: this.password,
      name: this.name,
      email: this.email,
      phone: this.phone,
      mfa: this.mfa,
      created_at: this.created_at
    });
    return this;
  }

  async update() {
    const updated: Partial<BaseUser> = {};

    for (const entry of this.updatedEntries || []) {
      (updated[entry] as BaseUser[keyof BaseUser]) = this[entry] as BaseUser[keyof BaseUser];
    }

    await db.users.update(updated).where({ id: this.id });
    return this;
  }

  async delete() {
    // todo update user deletion to give them time to think twice
    await db.sessions.delete().where({
      user_id: this.id
    });
    await this.setEmail("", "").update()
    return this;
  }

  setUsername(username: string) {
    this.username = username;
    this.updatedEntries?.push("username");
    return this;
  }

  setName(name: string | null) {
    this.name = name;
    this.updatedEntries?.push("name");
    return this;
  }

  /**
   * @warning mind providing the password along with the email
   */
  setEmail(email: string | null, password?: string) {
    this.email = email;
    this.updatedEntries?.push("email");
    if (email !== null && password) {
      this.password = generateHmac(password, email);
      this.updatedEntries?.push("password");
    }
    return this;
  }

  setPhone(phone: string | null) {
    this.phone = phone;
    this.updatedEntries?.push("phone");
    return this;
  }

  setPassword(password: string) {
    if (!this.email) return this;
    this.password = generateHmac(password, this.email);
    this.updatedEntries?.push("password");
    return this;
  }

  setRawPassword(hashed_password: string) {
    this.password = hashed_password;
    this.updatedEntries?.push("password");
    return this;
  }

  setFlag(flag: UserFlag) {
    this.flags |= UserFlags[flag];
    this.updatedEntries?.push("flags");
    return this;
  }

  clearFlag(flag: UserFlag) {
    this.flags &= ~UserFlags[flag];
    this.updatedEntries?.push("flags");
    return this;
  }

  hasFlag(flag: UserFlag) {
    return (this.flags & UserFlags[flag]) !== 0;
  }

  setFlags(flags: number) {
    this.flags = flags;
    this.updatedEntries?.push("flags");
    return this;
  }

  setMFA(mfa: string | null) {
    this.mfa = mfa;
    this.updatedEntries?.push("mfa");
    return this;
  }

  setCreatedAt(time: number) {
    this.created_at = time;
    return this;
  }

  clean(): CleanUser {
    return {
      id: this.id,
      flags: this.flags,
      username: this.username,
      name: this.name,
      email: this.email,
      phone: this.phone,
      created_at: this.created_at
    };
  }

  public(): PublicUser {
    return {
      id: this.id,
      flags: this.flags,
      username: this.username,
      name: this.name,
      created_at: this.created_at
    };
  }

  static async getById(id: string) {
    const user = await db.users.where({ id }).first();
    if (!user) return null;
    return new User(user.id, user.created_at)
      .setFlags(user.flags)
      .setUsername(user.username)
      .setRawPassword(user.password)
      .setName(user.name)
      .setEmail(user.email)
      .setPhone(user.phone)
      .setMFA(user.mfa);
  }

  static async id_exists(id: string) {
    const count = await db.users.where({ id }).count().first() as { "count(*)": number };
    return count["count(*)"] > 0;
  }

  static async email_exists(email: string) {
    const count = await db.users.where({ email }).count().first() as { "count(*)": number };
    return count["count(*)"] > 0;
  }

  static async username_exists(username: string) {
    const count = await db.users.where({ username }).count().first() as { "count(*)": number };
    return count["count(*)"] > 0;
  }

  static async getByEmail(email: string, ...fields: string[]) {
    const user = await db.users.select(...fields).where({ email }).first();
    if (!user) return null;
    return new User(user.id, user.created_at)
      .setFlags(user.flags)
      .setUsername(user.username)
      .setRawPassword(user.password)
      .setName(user.name)
      .setEmail(user.email)
      .setPhone(user.phone)
      .setMFA(user.mfa);
  }

  get sessions() {
    return new SessionManager(this.id);
  }

  get spaces() {
    return new SpaceManager(this.id);
  }

  get chats() {
    // todo implement global chat manager (for DMs, etc)
    // return new GlobalChatManager();
    throw Error("feature not implemented");
    return null;
  }

  // get relations() {
  //   return new RelationManager(this.id);
  // }
}

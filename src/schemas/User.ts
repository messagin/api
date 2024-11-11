import { generateHmac, generateIDv2 } from "../utils/auth";
import { SessionManager } from "../managers/Session";
import { SpaceManager } from "../managers/Space";
import { GlobalChatManager } from "../managers/GlobalChat";
import { RelationManager } from "../managers/Relation";
import db from "../utils/database";

const UserFlags = {
  Deleted: 1 << 0,
  Admin: 1 << 1,
  MfaEnabled: 1 << 2,
  Bot: 1 << 3,
  UnverifiedEmail: 1 << 4,
} as const;

const PublicFlagsBitfield = 0x000b;

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
  created_at: string;
}

export interface PartialUser {
  id: string;
  username: string;
  // flags: number;
  // avatar: string;
};

type CleanUser = Omit<BaseUser, "password" | "mfa">;
type PublicUser = Omit<CleanUser, "phone" | "name" | "email">;

export class User implements BaseUser {
  id: string;
  flags: number;
  username: string;
  password: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  mfa: string | null;
  created_at: string;

  private updatedEntries?: (keyof BaseUser)[];

  constructor(id?: string, time?: string) {
    this.id = id ?? generateIDv2();
    this.flags = 0;
    this.username = "";
    this.password = "";
    this.name = null;
    this.email = null;
    this.phone = null;
    this.mfa = null;
    this.created_at = time ?? new Date().toISOString();

    this.updatedEntries = [];
  }

  async create() {
    await db.execute("INSERT INTO users (id,flags,username,password,name,email,phone,mfa,created_at) VALUES (?,?,?,?,?,?,?,?,?)", [this.id, this.flags, this.username, this.password, this.name, this.email, this.phone, this.mfa, this.created_at], { prepare: true });
    return this;
  }

  async update() {
    // const updated: Partial<BaseUser> = {};

    // for (const entry of this.updatedEntries || []) {
    //   (updated[entry] as BaseUser[keyof BaseUser]) = this[entry] as BaseUser[keyof BaseUser];
    // }
    // return this;

    throw new Error("user update not implemented");
  }

  async updatePassword() {
    await db.execute("UPDATE users SET password = ? WHERE id = ?", [this.password, this.id], { prepare: true });
    return this;
  }

  async delete() {
    // todo update user deletion to give them time to think twice
    await db.execute("DELETE * FROM sessions WHERE user_id = ?", [this.id], { prepare: true });
    // keep the user record but mark as deleted
    // todo delete personal data from record (email, phone, etc)
    this.setFlag("Deleted");
    await db.execute("UPDATE users SET flags = ? WHERE id = ?", [this.flags, this.id], { prepare: true });
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

  get publicFlags() {
    return this.flags & PublicFlagsBitfield;
  }

  public(): PublicUser {
    return {
      id: this.id,
      flags: this.publicFlags,
      username: this.username,
      created_at: this.created_at
    };
  }

  static async getById(id: string): Promise<User | null> {
    const user = (await db.execute("SELECT * FROM users WHERE id = ?", [id], { prepare: true })).rows[0];
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
    const count = (await db.execute("SELECT count(*) FROM users WHERE id = ?", [id], { prepare: true })).rows[0].count.low;
    return count > 0;
  }

  static async email_exists(email: string) {
    const count = (await db.execute("SELECT count(*) FROM users WHERE email = ?", [email], { prepare: true })).rows[0].count.low;
    return count > 0;
  }

  static async username_exists(username: string) {
    const count = (await db.execute("SELECT count(*) FROM users WHERE username = ?", [username], { prepare: true })).rows[0].count.low;
    return count > 0;
  }

  static async getByEmail(email: string, /*...fields: (keyof BaseUser)[]*/) {
    const user = (await db.execute("SELECT * FROM users WHERE email = ?", [email], { prepare: true })).rows[0];
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
    return new GlobalChatManager(this.id);
  }

  get relations() {
    return new RelationManager(this.id);
  }
}

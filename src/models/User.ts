import { generateHmac, generateIDv2 } from "../utils/auth";
import { SessionManager } from "../managers/Session";
import { SpaceManager } from "../managers/Space";
import db from "../utils/database";

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
}

export class User implements BaseUser {
  id: string;
  flags: number;
  username: string;
  password: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  mfa: string | null;

  private updatedEntries?: (keyof BaseUser)[];

  constructor(id?: string) {
    this.id = id ?? generateIDv2();
    this.flags = 0;
    this.username = "";
    this.password = "";
    this.name = null;
    this.email = null;
    this.phone = null;
    this.mfa = null;

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

  setFlags(...flags: UserFlag[]) {
    let result = 0;
    for (const flag of flags) {
      result |= UserFlags[flag];
    }
    this.flags = result;
    this.updatedEntries?.push("flags");
    return this;
  }

  setRawFlags(flags: number) {
    this.flags = flags;
    this.updatedEntries?.push("flags");
    return this;
  }

  get Flags() {
    const result: { [K in UserFlag]: boolean } = (Object.keys(UserFlags) as UserFlag[])
      .reduce((acc, flag) => {
        acc[flag] = !!(UserFlags[flag] & this.flags);
        return acc;
      }, {} as { [K in UserFlag]: boolean });
    return result;
  }

  setMFA(mfa: string | null) {
    this.mfa = mfa;
    this.updatedEntries?.push("mfa");
    return this;
  }

  clean(): Partial<BaseUser> {
    const { updatedEntries, password, mfa, ...cleanUser } = this;
    updatedEntries; password; mfa;
    return cleanUser;
  }

  public(): Partial<BaseUser> {
    const { updatedEntries, password, mfa, email, phone, ...cleanUser } = this;
    updatedEntries; password; mfa; email; phone;
    return cleanUser;
  }

  static async getById(id: string) {
    const user = await db.users.where({ id }).first();
    if (!user) return null;
    const user_ = new User(user.id)
      .setRawFlags(user.flags)
      .setUsername(user.username)
      .setRawPassword(user.password)
      .setName(user.name)
      .setEmail(user.email)
      .setPhone(user.phone)
      .setMFA(user.mfa);
    return user_;
  }

  static async getByEmail(email: string, ...fields: string[]) {
    const user = await db.users.select(...fields).where({ email }).first();
    if (!user) return null;
    const user_ = new User(user.id)
      .setRawFlags(user.flags)
      .setUsername(user.username)
      .setRawPassword(user.password)
      .setName(user.name)
      .setEmail(user.email)
      .setPhone(user.phone)
      .setMFA(user.mfa);
    return user_;
  }

  get sessions() {
    return new SessionManager(this.id);
  }

  get spaces() {
    return new SpaceManager(this.id);
  }
}

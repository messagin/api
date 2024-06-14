import knex from "knex";

const db_ = knex({
  client: "better-sqlite3",
  connection: {
    filename: `${process.cwd()}/database${process.env.ENVIRONMENT === "dev" ? ".dev" : ""
      }.sql`
  }, useNullAsDefault: true
});

interface User {
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

interface Signup {
  id: string;
  flags: number;
  username: string;
  password: string;
  token: string;
  code: string;
  email: string | null;
  created_at: number;
}

interface Space {
  id: string;
  name: string;
  owner_id: string;
  created_at: number;
}

interface Session {
  id: string;
  user_id: string;
  token: string;
  flags: number;
  browser: string | null;
  os: string | null;
  ip: string | null;
  ua: string | null;
  updated_at: number;
  created_at: number;
}

interface Role {
  space_id: string;
  id: string;
  permissions: number;
  created_at: number;
};

interface PasswordReset {
  id: string;
  token: string;
};

interface EmailValidation {
  id: string;
  token: string;
};

interface Chat {
  id: string;
  name: string;
  space_id: string;
  created_at: number;
};

interface Member {
  space_id: string;
  user_id: string;
  share: number;
  permissions: number;
  color: number | null;
  created_at: number;
};

interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  flags: number;
  updated_at: number;
  created_at: number;
};

interface Ratelimit {
  type: string;
  count: number;
  created_at: number;
  id: string | null;
  ip: string | null;
};

interface MemberRole {
  space_id: string;
  user_id: string;
  role_id: string;
};

interface Invite {
  id: string;
  space_id: string;
  uses: number;
  max_uses: number;
  max_age: number;
  created_at: number;
};

interface Relation {
  user_id0: string;
  user_id1: string;
  flags: number;
  updated_at: number;
  created_at: number;
};

export async function initDatabase() {
  const usersExists = await db_.schema.hasTable("users");
  const chatsExists = await db_.schema.hasTable("chats");
  const rolesExists = await db_.schema.hasTable("roles");
  const signupExists = await db_.schema.hasTable("signup");
  const spacesExists = await db_.schema.hasTable("spaces");
  const membersExists = await db_.schema.hasTable("members");
  const invitesExists = await db_.schema.hasTable("invites");
  const messagesExists = await db_.schema.hasTable("messages");
  const sessionsExists = await db_.schema.hasTable("sessions");
  const relationsExists = await db_.schema.hasTable("relations");
  const ratelimitsExists = await db_.schema.hasTable("ratelimits");
  const memberRolesExists = await db_.schema.hasTable("member-roles");
  const passwordResetExists = await db_.schema.hasTable("password-reset");
  const emailValidationExists = await db_.schema.hasTable("email-validation");

  if (!usersExists) await db_.schema.createTable("users", table => {
    table.specificType("id", "char(16)").unique().primary();
    table.integer("flags").notNullable().defaultTo(0);
    table.text("username").notNullable().unique();
    table.text("name");
    table.text("email").unique();
    table.text("phone");
    table.specificType("password", "char(86)").notNullable();
    table.specificType("mfa", "char(96)");
    table.integer("created_at").notNullable();
  });

  if (!signupExists) await db_.schema.createTable("signup", table => {
    table.specificType("id", "char(16)").unique().primary();
    table.integer("flags").notNullable().defaultTo(0);
    table.text("username").notNullable();
    table.text("email").unique();
    table.specificType("password", "char(86)").notNullable();
    table.specificType("token", "char(64)").notNullable();
    table.specificType("code", "char(6)").notNullable();
    table.integer("created_at").notNullable();
  });

  if (!spacesExists) await db_.schema.createTable("spaces", table => {
    table.text("name");
    table.specificType("id", "char(16)").unique().primary();
    table.specificType("owner_id", "char(16)").references("id").inTable("users");
    table.integer("created_at").notNullable();
  });

  if (!chatsExists) await db_.schema.createTable("chats", table => {
    table.specificType("id", "char(16)").unique().primary();
    table.specificType("space_id", "char(16)").references("id").inTable("spaces");
    table.text("name").notNullable();
    table.integer("created_at").notNullable();
  });

  if (!membersExists) await db_.schema.createTable("members", table => {
    table.specificType("space_id", "char(16)").notNullable().references("id").inTable("spaces");
    table.specificType("user_id", "char(16)").notNullable().references("id").inTable("users");
    table.integer("share").notNullable().defaultTo(0); // in 1/1000
    table.integer("permissions").notNullable().defaultTo(0);
    table.integer("color", 4);
    table.integer("created_at").notNullable();
  });

  if (!invitesExists) await db_.schema.createTable("invites", table => {
    table.specificType("id", "char(16)").unique().primary();
    table.specificType("space_id", "char(16)").references("id").inTable("spaces");
    table.integer("uses").notNullable().defaultTo(0);
    table.integer("max_uses").notNullable().defaultTo(1);
    table.integer("max_age").notNullable().defaultTo(0);
    table.integer("created_at").notNullable();
  });

  if (!messagesExists) await db_.schema.createTable("messages", table => {
    table.specificType("chat_id", "char(16)").notNullable().references("id").inTable("chats");
    table.specificType("user_id", "char(16)").notNullable().references("id").inTable("users");
    table.specificType("id", "char(16)").unique().primary();
    table.text("content").notNullable();
    table.integer("flags").notNullable().defaultTo(0);
    table.integer("updated_at").notNullable().defaultTo(0);
    table.integer("created_at").notNullable();
  });

  if (!sessionsExists) await db_.schema.createTable("sessions", table => {
    table.specificType("id", "char(16)").notNullable().primary();
    table.specificType("user_id", "char(16)").references("id").inTable("users");
    table.specificType("token", "char(86)").notNullable();
    table.integer("flags").notNullable().defaultTo(0);
    table.string("browser");
    table.string("os");
    table.string("ip", 39);
    table.string("ua");
    table.integer("updated_at").notNullable();
    table.integer("created_at").notNullable();
  });

  if (!relationsExists) await db_.schema.createTable("relations", table => {
    table.specificType("user_id0", "char(16)").references("id").inTable("users");
    table.specificType("user_id1", "char(16)").references("id").inTable("users");
    table.integer("flags").notNullable().defaultTo(0);
    table.integer("updated_at").notNullable();
    table.integer("created_at").notNullable();
  });

  if (!passwordResetExists) await db_.schema.createTable("password-reset", table => {
    table.specificType("id", "char(16)").references("id").inTable("users").primary();
    table.specificType("token", "char(86)").notNullable();
  });

  if (!emailValidationExists) await db_.schema.createTable("email-validation", table => {
    table.specificType("id", "char(16)").notNullable().primary();
    table.specificType("token", "char(86)").notNullable();
  });

  if (!ratelimitsExists) await db_.schema.createTable("ratelimits", table => {
    table.specificType("id", "char(16)");
    table.string("type", 2);
    table.string("ip", 39);
    table.integer("count").defaultTo(0);
    table.integer("created_at").notNullable();
  });

  if (!rolesExists) await db_.schema.createTable("roles", table => {
    table.specificType("id", "char(16)").notNullable().primary();
    table.specificType("space_id", "char(16)").references("id").inTable("spaces");
    table.integer("flags");
    table.integer("permissions");
    table.integer("created_at").notNullable();
  });

  if (!memberRolesExists) await db_.schema.createTable("member-roles", table => {
    table.specificType("space_id", "char(16)").references("id").inTable("spaces");
    table.specificType("user_id", "char(16)").references("id").inTable("users");
    table.specificType("role_id", "char(16)").references("id").inTable("roles");
  })

}

export default class Database {
  static get users() {
    return db_<User>("users");
  }
  static get roles() {
    return db_<Role>("roles");
  }
  static get chats() {
    return db_<Chat>("chats");
  }
  static get signup() {
    return db_<Signup>("signup");
  }
  static get spaces() {
    return db_<Space>("spaces");
  }
  static get members() {
    return db_<Member>("members");
  }
  static get invites() {
    return db_<Invite>("invites");
  }
  static get messages() {
    return db_<Message>("messages");
  }
  static get sessions() {
    return db_<Session>("sessions");
  }
  static get relations() {
    return db_<Relation>("relations");
  }
  static get ratelimits() {
    return db_<Ratelimit>("ratelimits");
  }
  static get memberRoles() {
    return db_<MemberRole>("member-roles");
  }
  static get passwordReset() {
    return db_<PasswordReset>("password-reset");
  }
  static get emailValidation() {
    return db_<EmailValidation>("email-validation");
  }
}

const db = require("knex").default({
	client: "better-sqlite3",
	connection: {
		filename: "messagin.db"
	}, useNullAsDefault: true
});


async function initDatabase() {
	const usersExists = await db.schema.hasTable("users");
	const signupExists = await db.schema.hasTable("signup");
	const chatsExists = await db.schema.hasTable("chats");
	const membersExists = await db.schema.hasTable("members");
	const messagesExists = await db.schema.hasTable("messages");
	const ratelimitsExists = await db.schema.hasTable("ratelimits");

	if (!usersExists) await db.schema.createTable("users", table => {
		table.specificType("id", "char(16)").unique().primary();
		table.integer("flags").notNullable().defaultTo(0);
		table.text("username").notNullable();
		table.text("email").unique();
		table.specificType("password", "char(86)").notNullable();
		table.specificType("token", "char(86)");
		table.specificType("mfa", "char(96)");
		table.integer("last_login");
	});

	if (!signupExists) await db.schema.createTable("signup", table => {
		table.specificType("token", "char(64)").notNullable();
		table.specificType("code", "char(6)").notNullable();
		table.text("username").notNullable();
		table.text("email").unique().notNullable();
		table.specificType("password", "char(86)").notNullable();
		table.integer("timestamp").notNullable();
	});

	if (!chatsExists) await db.schema.createTable("chats", table => {
		table.specificType("id", "char(16)").unique().primary();
		table.text("name").notNullable();
	});

	if (!membersExists) await db.schema.createTable("members", table => {
		table.specificType("chat_id", "char(16)").notNullable();
		table.specificType("user_id", "char(16)").notNullable();
		table.foreign("chat_id").references("id").inTable("chats");
		table.foreign("user_id").references("id").inTable("users");
		table.integer("permissions").notNullable().defaultTo(0);
		table.specificType("color", "char(6)");
	});

	if (!messagesExists) await db.schema.createTable("messages", table => {
		table.specificType("chat_id", "char(16)").notNullable();
		table.specificType("user_id", "char(16)").notNullable();
		table.specificType("id", "char(16)").unique().primary();
		table.text("content").notNullable();
		table.foreign("chat_id").references("id").inTable("chats");
		table.foreign("user_id").references("id").inTable("users");
		table.integer("flags").notNullable().defaultTo(0);
	});

	if (!ratelimitsExists) await db.schema.createTable("ratelimits", table => {
		table.specificType("id", "char(16)");
		table.string("type", 2); // ip | id
		table.string("ip", 39);
		table.integer("count").defaultTo(0);
		table.integer("timestamp").notNullable();
	});

}

module.exports = { db, initDatabase };

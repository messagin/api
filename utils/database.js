const db = require("knex").default({
	client: "better-sqlite3",
	connection: {
		filename: "messagin.db"
	}, useNullAsDefault: true
});

async function init() {
	let signupExists = await db.schema.hasTable("signup");
	let usersExists = await db.schema.hasTable("users");
	let chatsExists = await db.schema.hasTable("chats");
	let membersExists = await db.schema.hasTable("members");
	let messagesExists = await db.schema.hasTable("messages");

	if (!signupExists) await db.schema.createTable("signup", table => {
		table.specificType("token", "char(64)").notNullable();
		table.specificType("code", "char(6)").notNullable();
		table.text("username").notNullable();
		table.text("email").unique().notNullable();
		table.specificType("password", "char(128)").notNullable();
		table.integer("timestamp").notNullable();
	});

	if (!usersExists) await db.schema.createTable("users", table => {
		table.specificType("id", "char(16)").unique().primary();
		table.integer("flags").notNullable().defaultTo(0);
		table.text("username").notNullable();
		table.text("email").unique();
		table.specificType("password", "char(128)").notNullable();
		table.specificType("token", "char(128)");
		table.specificType("mfa", "char(96)");
		table.integer("last_login");
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
}

module.exports = { db, init };

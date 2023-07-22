const { db } = require("../utils/database");
const { log } = require("../utils/log");

class User {
	constructor({ id, flags, username, email, password, token, mfa, last_login }) {
		this.id = id;
		this.flags = flags;
		this.username = username;
		this.email = email;
		this.password = password;
		this.token = token;
		this.mfa = mfa;
		this.last_login = last_login;
	}

	async set(field, value) {
		await db("users").update({ [field]: value }).where({ id: this.id });
	}

	static async getById(id, ...fields) {
		let raw_user = await db("users").select(...fields).where({ id }).first();
		if (!raw_user) return null;
		let user = new User(raw_user);
		return user;
	}

	static async getByEmail(email, ...fields) {
		let raw_user = await db("users").select(...fields).where({ email }).first();
		if (!raw_user) return null;
		let user = new User(raw_user);
		return user;
	}

	static async create(id, username, email, password, token) {
		let r = await db("users").insert({
			id,
			flags: 0,
			username,
			email,
			password,
			token
		}).catch(log("red"));
		return r;
	}

	async setToken(token) {
		let r = await db("users").update({ token }).where({ id: this.id });
		return r;
	}
}


module.exports = { User };

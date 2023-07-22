const { db } = require("../utils/database");
const { log } = require("../utils/log");

class Chat {
	constructor({ id }) {
		this.id = id;
	}

	async set(field, value) {
		await db("chats").update({ [field]: value }).where({ id: this.id });
	}

	static async getById(id) {
		let raw_user = await db("chats").where({ id }).first();
		if (!raw_user) return null;
		let user = new Chat(raw_user);
		return user;
	}

	static async create(id, name) {
		let r = await db("chats").insert({
			id, name
		}).catch(log("red"));
		return r;
	}

	async setToken(token) {
		let r = await db("users").update({ token }).where({ id: this.id });
		return r;
	}
}


module.exports = { User };

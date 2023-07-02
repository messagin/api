const { db } = require("../utils/database");

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

	static validate(user) {
		let errors = [];
		if (!user) {
			errors.push();
		}
	}

	static validatePartial(user) {

	}

	static async getById(id) {
		let raw_user = await db("users").where({ id }).first();
		if (!raw_user) return null;
		let user = new User(raw_user);
		return user;
	}
}


module.exports = { User };

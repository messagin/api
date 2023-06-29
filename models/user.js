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
		}
	}
	static validatePartial(user) {

	}
}


module.exports = { User };

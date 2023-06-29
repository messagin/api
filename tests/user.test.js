const { User } = require("../models/user");

describe("User Model", () => {
	test("should create a user object", () => {
		let user_id = "0000000000000000";
		let username = "John Doe";

		const user = new User(user_id, username);

		expect(user.id).toBe(user_id);
		expect(user.username).toBe(username);
	});
});

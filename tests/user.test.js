const { db, initDatabase } = require("../utils/database");
const { User } = require("../models/user");

describe("User Model", () => {

	beforeAll(async () => {
		await initDatabase();
	});

	test("should create a user object", () => {
		let user_id = "0000000000000000";
		let username = "John Doe";
		const user = new User({ id: user_id, username });
		expect(user.id).toBe(user_id);
		expect(user.username).toBe(username);
	});

	test("should be null", async () => {
		const user = await User.getById("0000000000000000");
		expect(user).toBe(null);
	});

	afterAll(() => {
		db.destroy();
	});

});

const { Request, Response } = require("express");
const { StatusCodes } = require("../utils/status");
const { User } = require("../models/user");
const { respond } = require("../utils/respond");
const { generateIDv2, generateToken, generateHash, generateHmac } = require("../utils/auth");


/**
 * @param {Request} req
 * @param {Response} res
 */
async function create(req, res) {

	let email_exists = await User.getByEmail(req.body.email);
	if (email_exists) {
		return respond(res, 409, StatusCodes[409].EmailExists);
	}

	let id = generateIDv2();
	let token = generateToken(id);

	await User.create(id, req.body.username, req.body.email, generateHmac(req.body.password, req.body.email), token.hash);

	respond(res, 201, StatusCodes[201].UserCreated, {
		token: token.string
	});
}

async function destroy(req, res) {
	// todo allow the user to think twice, so delete after some delay and warn him by email

	respond(res, 202, StatusCodes[202].UserDeletionPending);
}

/**
 * @param {Request} req
 * @param {Response} res
 */
async function login(req, res) {

	// if (!User.validatePartial(req.body, "email", "password")) {
	// 	return respond(res, 400, StatusCodes[400].InvalidBody);
	// }

	let user = await User.getByEmail(req.body.email);

	if (!user) return respond(res, 401, StatusCodes[401].InvalidCredentials);

	if (user.password != generateHmac(req.body.password, req.body.email)) {
		return respond(res, 401, StatusCodes[401].InvalidCredentials);
	}

	let token = generateToken(user.id);
	await user.setToken(token.hash);

	return respond(res, 200, StatusCodes[200].Ok, {
		token: token.string
	});
}

/**
 * @param {Request} req
 * @param {Response} res
 */
async function createTrial(req, res) {

	// generate an ID for the user
	const id = generateIDv2();

	// create a token from that ID
	const token = generateToken(id);

	// insert the user into the database
	const inserted = await User.create(id, req.body.username, null, generateHash("0"), token.hash);

	// if some error happened during INSERT, that's an Internal Server Error (500)
	if (!inserted) return respond(res, 500, StatusCodes[500].InternalError);

	console.log(token);

	return respond(res, 201, StatusCodes[201].UserCreated, {
		token: token.string
	});

}

/**
 * @param {Request} _req
 * @param {Response} res
 */
async function getCurrent(_req, res) {
	try {
		const user = await User.getById(res.locals.user_id);
		return respond(res, 200, StatusCodes[200].Ok, user);
	} catch (err) {
		console.log(err);
		return respond(res, 500, StatusCodes[500].InternalError);
	}
}

/**
 * @param {Request} req
 * @param {Response} res
 */
async function getById(req, res) {
	const id = req.params.id;

	let user;
	try {
		user = await User.getById(req.params.id);
	} catch (err) {
		console.log(err);
		return respond(res, 500, StatusCodes[500].InternalError);
	}

	if (!user) {
		return respond(res, 404, StatusCodes[404].NotFound);
	}

	return respond(res, 200, StatusCodes[200].Ok, {
		id: user.id,
		username: user.username,
		flags: user.flags
	});
}

async function validateMfa(req, res) {

}

/**
 * @param {Request} req
 * @param {Response} res
 */
async function updatePassword(req, res) {
	// validate

	let { currentPassword, newPassword } = req.body;

	try {
		let user = await User.getById(res.locals.user_id);
		console.log(user);
		if (!user.email) {
			// cannot update password for a temporary user
			return respond(res, 400, StatusCodes[400].TempUser);
		}
		if (generateHmac(currentPassword, user.email) != user.password) {
			return respond(res, 400, StatusCodes[400].WrongPassword);
		}
		await user.set("password", generateHmac(newPassword, user.email));
		return respond(res, 204, StatusCodes[204]);
	} catch (e) {
		console.log(e);
		return respond(res, 500, StatusCodes[500].InternalError);
	}

}

module.exports = {
	getCurrent,
	getById,
	create,
	validateMfa,
	createTrial,
	login,
	destroy,
	updatePassword
};

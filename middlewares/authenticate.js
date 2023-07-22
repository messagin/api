const { respond } = require("../utils/respond");
const { StatusCodes } = require("../utils/status");
const { db } = require("../utils/database");
const { generateHash } = require("../utils/auth");
const { UserFlags } = require("../utils/flags");

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function authenticate(req, res, next) {

	let [type, token] = req.headers.authorization?.split(" ") ?? [null, null];

	if (!token) {
		return respond(res, 401, StatusCodes[401].MissingToken);
	}

	if (type != "User" && type != "Bot") {
		return respond(res, 400, StatusCodes[400].UnknownTokenType);
	}

	if (token.length != 96) {
		return respond(res, 401, StatusCodes[401].MalformedToken);
	}

	let xid = token.substring(0, 22);
	let id = Buffer.from(xid, "base64").toString("utf8");

	if (!/^[0-9A-HJKMNP-TV-Z]{16}$/.test(id)) {
		return respond(res, 401, StatusCodes[401].MalformedToken);
	}

	let user;
	try {
		user = await db("users").select("token").where({ id }).first();
	} catch (err) {
		console.log(err);
		return respond(res, 500, StatusCodes[500].InternalError);
	}

	if (!user) {
		return respond(res, 401, StatusCodes[401].InvalidToken);
	}

	if (generateHash(token) != user.token) {
		return respond(res, 401, StatusCodes[401].InvalidToken);
	}

	if (user.flags & UserFlags.Bot && type == "Bot") {
		res.locals.is_bot = true;
		res.locals.user_id = id;
		return next();
	}

	if (!(user.flags & UserFlags.Bot) && type == "User") {
		res.locals.is_bot = false;
		res.locals.user_id = id;
		return next();
	}

	return respond(res, 403, StatusCodes[403].WrongTokenType);

}

module.exports = { authenticate };

const { respond } = require("../utils/respond");
const { StatusCodes } = require("../utils/status");

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
let authenticate = async (req, res, next) => {

	let token = req.headers.authorization;
	if (!token) {
		return respond(res, 401, StatusCodes[401].MissingToken);
	}

	let [ id, key ] = token.split(".");

	if (!id || id.length != 16) {
		return respond(res, 401, StatusCodes[401].InvalidToken);
	} else if (!key || key.length != 96) {
		return respond(res, 401, StatusCodes[401].MalformedToken);
	}

	let user;
	try {
		user = await db("users").select("token").where({ id: data.id }).first();
	} catch (err) {
		console.log(err);
		return respond(res, 500, StatusCodes[500].InternalError);
	}

	if (!user) {
		return respond(res, 401, StatusCodes[401].InvalidToken);
	}

	if (data.hash == user.token) {
		res.locals.user_id = data.id;
		return next();
	} else {
		return respond(res, 401, StatusCodes[401].InvalidToken);
	}

}

module.exports = { authenticate };

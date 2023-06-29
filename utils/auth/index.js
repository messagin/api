const auth = require("./auth.node");
const { default: knex } = require("knex");
const { respond } = require("../respond");
const { log } = require("../log");

const db = knex({
	client: "better-sqlite3",
	connection: {
		filename: "database.sql"
	}, useNullAsDefault: true
});

let parseToken = token => {
	if (!token) return null;
	let spl = token.split(".");
	let id = Buffer.from(spl[0], "base64url").toString();
	if (!id || id.length != 16) return null;
	else if (spl[1].length != 96) return null;
	else return { id, key: spl[1], hash: auth.generateHash(spl[1]) };
}

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
let authenticate = async (req, res, next) => {
	let token;
	if (req.headers.authorization) token = req.headers.authorization;
	if (req.cookies.access_token) token = req.cookies.access_token;
	if (!token) return respond(res, 401);
	let data = parseToken(token);
	if (!data) return respond(res, 401);
	let user = await db("users")
		.select("token")
		.where({ id: data.id })
		.first()
		.catch(log("red"));
	if (!user) return respond(res, 401);
	if (data.hash == user.token) {
		res.locals.user_id = data.id
		return next();
	}
	else return respond(res, 401);
}

/**
 * @param {import("express").Request} req
 */
let authenticated = async (req) => {
	let token;
	if (req.headers.authorization) token = req.headers.authorization;
	if (req.cookies.access_token) token = req.cookies.access_token;
	if (!token) return false;
	let data = parseToken(token);
	if (!data) return false;
	if (!Object.keys(data).length) return false;
	let user = await db("users")
		.select("token")
		.where({ id: data.id })
		.first()
		.catch(log("red"));
	if (!user) return false;
	req.res.locals.user_id = data.id;
	return data.hash == user.token;
}

module.exports = { ...auth, authenticate, authenticated };

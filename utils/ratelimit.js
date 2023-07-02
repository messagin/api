const { db } = require("./database");
const { respond } = require("./respond");
const { StatusCodes } = require("./status");

// x-ratelimit-limit: 60
// x-ratelimit-remaining: 59
// x-ratelimit-reset: 1688320872
// x-ratelimit-used: 1

const WINDOW_SIZE = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 10; // Max requests per window size

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function ratelimit(req, res, next) {

	const ip = req.ip;

	if (!ip) {
		console.log("Error: IP address is undefined");
		return respond(res, 500, StatusCodes[500].MissingIp);
	}

	const now = Date.now();
	const start = now - WINDOW_SIZE;

	try {
		await db("ratelimits").where("timestamp", "<", start).del();

		const data = await db('ratelimits').where({ ip }).first();

		if (!data) {
			await db("ratelimits").insert({ ip, timestamp: now, count: 1 });
			res.header("x-ratelimit-limit", WINDOW_SIZE);
			return next();
		}

		if (data.count >= MAX_REQUESTS) {
			return respond(res, 429, StatusCodes[429].RateLimited);
		}

		await db("ratelimits").increment("count").where({ ip });

		next();
	} catch (err) {
		console.log(err);
		return respond(res, 500, StatusCodes[500].InternalError);
	}
}

module.exports = { ratelimit }

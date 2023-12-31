const { db } = require("./database");
const { respond } = require("./respond");
const { StatusCodes } = require("./status");

// x-ratelimit-limit: 60
// x-ratelimit-remaining: 59
// x-ratelimit-reset: 1688320872
// x-ratelimit-used: 1

const WINDOW_SIZE = 24 * 60 * 60; // 1 day
const MAX_REQUESTS = 1000; // Max invalid requests per window size

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function rateLimitByIp(req, res, next) {
	const ip = req.ip;

	if (!ip) {
		console.log("Error: IP address is undefined");
		return respond(res, 500, StatusCodes[500].MissingIp);
	}

	const now = Math.floor(Date.now() / 1000);
	const start = now - WINDOW_SIZE;

	try {
		await db("ratelimits").where("timestamp", "<", start).andWhere("type", "ip").del();

		let data = await db('ratelimits').where({ ip }).first();

		if (!data) {
			await db("ratelimits").insert({ ip, timestamp: now, count: 0, type: "ip" });
			data = { count: 0, timestamp: now };
		}

		res.locals.rateLimit = {
			limit: MAX_REQUESTS,
			remaining: MAX_REQUESTS - data.count,
			reset: data.timestamp + WINDOW_SIZE,
			type: "ip"
		};

		if (data.count >= MAX_REQUESTS) {
			return await respond(res, 429, StatusCodes[429].RateLimited);
		}

		next();
	} catch (err) {
		console.log(err);
		return await respond(res, 500, StatusCodes[500].InternalError);
	}
}


module.exports = { rateLimitByIp };

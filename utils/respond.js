const { db } = require("./database");
const { StatusCodes, StatusMessages } = require("./status");

/**
 * @param {import("express").Response} res
 * @param {number} status
 * @param {number} code
 * @param {object} data
 */
async function respond(res, status, code, data) {
	const response = {
		code: code,
		message: StatusMessages[code],
		url: `${process.env.CODE_REDIRECT}#${code}`,
		data: data
	};
	if (status == 401 || status == 403) {
		// rate limit unauthorized requests (by IP)
		await db("ratelimits").where({ ip: res.req.ip }).increment("count");
		res.locals.rateLimit.remaining--;
	}
	if (res.locals.user_id && status == 429) {
		// rate limit the application (by ID)
		// if too many 429 requests, reset the application token
	}
	// if (stat)

	if (res.locals.rateLimit) {
		const { limit, remaining, reset, type } = res.locals.rateLimit;
		res.set("X-RateLimit-Limit", limit);
		res.set("X-RateLimit-Remaining", remaining);
		res.set("X-RateLimit-Reset", reset);
		res.set("X-RateLimit-Type", type);
	}

	res.status(status).json(response);
}

module.exports = { respond };

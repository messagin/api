const { StatusCodes, StatusMessages } = require("./status");

/**
 * @param {import("express").Response} res
 * @param {number} status
 * @param {object} data
 */
function respond(res, status, code, data = {}) {
	let resp = (st, data) => {
		res.status(st).json(data).end();
	}

	if (!data || typeof data != "object") {
		let code = StatusCodes[500].InternalError;
		return resp(500, {
			status: 500, code, message: StatusMessages[code]
		});
	}
	resp(status, {
		status: status,
		code,
		message: StatusMessages[code],
		url: process.env.ERROR_REDIRECT + "#" + code,
		...data
	});
}

module.exports = { respond };

const { StatusCodes, StatusMessages } = require("./status");

/**
 * @param {import("express").Response} res
 * @param {number} status
 * @param {number} code
 * @param {object} data
 */
function respond(res, status, code, data) {
	const response = {
		code: code,
		message: StatusMessages[code],
		url: `${process.env.CODE_REDIRECT}#${code}`,
		data: data
	}
	res.status(status).json(response);
}

module.exports = { respond };

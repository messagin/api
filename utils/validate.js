const { respond } = require("./respond");
const { StatusCodes } = require("./status");

/**
 * @param {import("express").Request} req
 */
function validateID(req) {
	if (/^[0-9a-zA-Z]{16}$/.test(req.query)) return req.next();
	return respond(req.res, 400, StatusCodes[400].MalformedId);
}

module.exports = { validateID }

const { Request, Response } = require("express");
const { StatusCodes } = require("../utils/status");
const { User } = require("../models/user");


/**
 * @param {Request} req
 * @param {Response} res
 */
async function create(req, res) {

}

/**
 * @param {Request} _req
 * @param {Response} res
 */
async function getCurrent(_req, res) {
	let user;
	try {
		user = await User.getById(res.locals.user_id);
	} catch (err) {
		console.log(err);
		return respond(res, 500, StatusCodes[500].InternalError);
	}

	return respond(res, 200, StatusCodes[200].Ok, user);
}

/**
 * @param {Request} req
 * @param {Response} res
 */
async function getById(req, res) {
	let user;
	try {
		user = await User.getById(req)
	} catch (err) {
		console.log(err);
		return respond(res, 500, StatusCodes[500].InternalError);
	}

	return respond(res, 200, StatusCodes[200], {
		id: user.id,
		username: user.username,
		flags: user.flags
	});
}

async function validateMfa(req, res) {

}

module.exports = {
	getCurrent,
	getById,
	create,
	validateMfa
}

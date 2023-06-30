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
 * @param {Request} req
 * @param {Response} res
 */
async function getCurrentUser(req, res) {
	let user;
	try {
		user = await User.getById(s.locals.user_id);
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

	return respond(res, 200, StatusCodes[200])
}

async function mfaValidate(req, res) {

}

module.exports = {
	create,
	getCurrentUser,
	mfaValidate
}

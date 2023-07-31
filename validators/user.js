const { Request, Response, NextFunction } = require("express");
const { respond } = require("../utils/respond");
const { StatusCodes } = require("../utils/status");

/**
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
function getById(req, res, next) {
	if (!/^[0-9A-HJKMNP-TV-Z]{16}$/.test(req.params.id)) {
		return respond(res, 400, StatusCodes[400].MalformedId);
	}
	return next();
}

/**
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
function createTrial(req, res, next) {
	if (!req.body.username) {
		return respond(res, 400, StatusCodes[400].InvalidBody);
	}
	return next();
}

/**
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
function create(req, res, next) {
	let errors = {};
	if (!req.body.username) {
		errors.username = "missing";
	} else if (typeof req.body.username != "string" || req.body.username.length < 2) {
		errors.username = "invalid";
	}
	if (!req.body.email) {
		errors.email = "missing";
	} else if (!/.+@.+/.test(req.body.email)) {
		errors.email = "invalid";
	}
	if (!req.body.password) {
		errors.password = "missing";
	} else if (typeof req.body.username != "string" || req.body.password.length < 8) {
		errors.password = "invalid";
	}
	if (Object.keys(errors).length) {
		return respond(res, 400, StatusCodes[400].InvalidBody, { errors });
	}
	return next();
}

module.exports = {
	getById,
	createTrial,
	create
}

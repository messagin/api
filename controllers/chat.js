const { Request, Response } = require("express");
const { StatusCodes } = require("../utils/status");
// const { Chat } = require("../models/chat");
const { respond } = require("../utils/respond");
const { generateIDv2 } = require("../utils/auth");
const { db } = require("../utils/database");

/**
 * @param {Request} req
 * @param {Response} res
 */
async function create(req, res) {
	// fixme remove validation
	if (!req.body.name) {
		return respond(res, 400, StatusCodes[400].InvalidBody);
	}
	const id = generateIDv2();
	try {
		await db("chats").insert({ id, name: req.body.name });
		await db("members").insert({ chat_id: id, user_id: res.locals.user_id, permissions: 1 })
		return respond(res, 201, StatusCodes[201].ChatCreated, { id, name: req.body.name });
	} catch (err) {
		console.log(err);
		return respond(res, 500, StatusCodes[500].InternalError);
	}
}

module.exports = {
	create
}

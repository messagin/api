import { Request, Response, NextFunction } from "express";
import { respond } from "../utils/respond";
import { generateHash } from "../utils/auth.node";
import { log } from "../utils/log";
import { Session } from "../models/Session";

export async function authenticate(req: Request, res: Response, next: NextFunction) {

	const [type, xtoken] = req.headers.authorization?.split(" ") ?? [null, null];

	if (!xtoken) {
		return respond(res, 401, "MissingToken");
	}

	if (type !== "User" && type !== "Bot") {
		return respond(res, 400, "UnknownTokenType");
	}

	if (xtoken.length !== 96) {
		return respond(res, 401, "MalformedToken");
	}

	const id = Buffer.from(xtoken.slice(0, 22), "base64url").toString("utf8");
  const token = generateHash(xtoken);

	if (!/^[0-9A-HJKMNP-TV-Z]{16}$/.test(id)) {
		return respond(res, 401, "MalformedToken");
	}

	let session;
	try {
		session = await Session.getById(id);
	}
  catch (err) {
    log("red")((err as Error).message)
		return respond(res, 500, "InternalError");
	}

	if (!session || session.token.hash !== token) {
		return respond(res, 401, "InvalidToken");
	}

  if ((session.Flags.Bot && type === "Bot") || (!session.Flags.Bot && type === "User")) {
		res.locals.is_bot = session.Flags.Bot;
    res.locals.session = session.id;
		res.locals.user_id = session.user_id;
    await session.setTimestamp().update();
		return next();
	}

	return respond(res, 403, "WrongTokenType");
}

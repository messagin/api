import { Request, Response } from "express";
import { User } from "../models/User";
import { respond } from "../utils/respond";
import { generateHash, generateHmac, generateIDv2, generateToken } from "../utils/auth";
import { log } from "../utils/log";
import { Session } from "../models/Session";

export async function create(req: Request, res: Response) {
  const emailExists = await User.getByEmail(req.body.email);
  if (emailExists) {
    return respond(res, 409, "EmailExists");
  }

  const user = new User()
    .setUsername(req.body.username)
    .setEmail(req.body.email, req.body.password);

  try {
    await user.create();
    const session = await user.sessions.create(req);

    respond(res, 201, "UserCreated", {
      token: session.token.string
    });
  }
  catch (err) {
    log("red")((err as Error).message);
    respond(res, 500, "InternalError");
    return;
  }

}

export async function destroy(_req: Request, res: Response) {
  // todo allow the user to think twice, so delete after some delay and warn him by email

  respond(res, 202, "UserDeletionPending");
}

export async function login(req: Request, res: Response) {
  if (req.body.token) {
    const xtoken = req.body.token;
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

    return respond(res, 200, "Ok", {
      token: xtoken,
      type: session.Flags.Bot ? "Bot" : "User"
    });
  }

  // if (!User.validatePartial(req.body, "email", "password")) {
  // 	return respond(res, 400, StatusCodes[400].InvalidBody);
  // }

  let user: User | null;
  try {
    user = await User.getByEmail(req.body.email);
  }
  catch (err) {
    respond(res, 500, "InternalError");
    return;
  }

  if (!user) {
    respond(res, 401, "InvalidCredentials");
    return;
  }

  if (user.password !== generateHmac(req.body.password, req.body.email)) {
    respond(res, 401, "InvalidCredentials");
    return;
  }

  const session = await user.sessions.create(req);

  return respond(res, 200, "Ok", {
    type: "User",
    token: session.token.string
  });
}

export async function createTrial(req: Request, res: Response) {

  // generate an ID for the user
  const id = generateIDv2();

  // create a token from that ID
  const token = generateToken(id);

  const user = new User(id)
    .setUsername(req.body.username)
    .setEmail("", "");

  try {
    await user.create();

    return respond(res, 201, "UserCreated", {
      token: token.string
    });
  }
  catch (err) {
    // if some error happened during INSERT, that's an Internal Server Error (500)
    return respond(res, 500, "InternalError");
  }
}

export async function getCurrent(_req: Request, res: Response<Record<string, never>, { user_id: string }>) {
  try {
    const user = await User.getById(res.locals.user_id);
    return respond(res, 200, "Ok", user?.clean());
  } catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function getById(req: Request, res: Response) {
  const id = req.params.user_id;

  let user;
  try {
    user = await User.getById(id);
  } catch (err) {
    log("red")((err as Error).message)
    return respond(res, 500, "InternalError");
  }

  if (!user) {
    return respond(res, 404, "NotFound");
  }

  return respond(res, 200, "Ok", user.public());
}

export async function validateMfa(req: Request, res: Response) {
  req; res;
  return null;
}

export async function updatePassword(req: Request, res: Response) {
  req; res;
  // // validate

  // let { currentPassword, newPassword } = req.body;

  // try {
  // 	let user = await User.getById(res.locals.user_id);

  //   if (!user.email) {
  // 		// cannot update password for a temporary user
  // 		return respond(res, 400, StatusCodes[400].TempUser);
  // 	}
  // 	if (generateHmac(currentPassword, user.email) !== user.password) {
  // 		return respond(res, 400, StatusCodes[400].WrongPassword);
  // 	}
  // 	await user.set("password", generateHmac(newPassword, user.email));
  // 	return respond(res, 204, StatusCodes[204]);
  // } catch (e) {
  // 	console.log(e);
  // 	return respond(res, 500, StatusCodes[500].InternalError);
  // }

}

import { Request, Response } from "express";
import { User } from "../schemas/User";
import { respond } from "../utils/respond";
import { generateHash, generateHmac } from "../utils/auth";
import { log } from "../utils/log";
import { Session } from "../schemas/Session";

export async function create(req: UserRequest.Create, res: Response) {
  const emailExists = await User.email_exists(req.body.email);
  if (emailExists) {
    return respond(res, 409, "EmailExists");
  }

  const usernameExists = await User.username_exists(req.body.username);
  if (usernameExists) {
    return respond(res, 409, "UsernameExists");
  }

  const user = new User()
    .setUsername(req.body.username)
    .setName(req.body.name ?? null)
    .setEmail(req.body.email, req.body.password);

  try {
    await user.create();
    const session = await user.sessions.create(req);

    return respond(res, 201, "UserCreated", {
      token: session.token.string
    });
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function destroy(_req: UserRequest.Destroy, res: Response) {
  // todo allow the user to think twice, so delete after some delay and warn him by email

  respond(res, 202, "UserDeletionPending");
}

export async function login(req: UserRequest.Login, res: Response) {
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
      type: session.hasFlag("Bot") ? "Bot" : "User"
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
    return respond(res, 500, "InternalError");
  }

  if (!user) {
    return respond(res, 401, "InvalidCredentials");
  }

  if (user.password !== generateHmac(req.body.password, req.body.email)) {
    return respond(res, 401, "InvalidCredentials");
  }

  const session = await user.sessions.create(req);

  return respond(res, 200, "Ok", {
    type: "User",
    token: session.token.string
  });
}

export async function createTrial(req: UserRequest.CreateTrial, res: Response) {

  // generate an ID for the user

  // create a token from that ID

  const user = new User()
    .setUsername(req.body.username)
    .setFlag("UnverifiedEmail")
    .setEmail("", "");

  try {
    await user.create();
    const session = await user.sessions.create(req);

    return respond(res, 201, "UserCreated", {
      token: session.token.string
    });
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function getSelf(_req: UserRequest.GetSelf, res: Response) {
  try {
    const user = await User.getById(res.locals.user_id);
    return respond(res, 200, "Ok", user!.clean());
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function getById(req: UserRequest.GetById, res: Response) {
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

export async function validateMfa(req: UserRequest.ValidateMfa, res: Response) {
  // todo finish implementing
  req; res;
  return null;
}

export async function updatePassword(req: UserRequest.UpdatePassword, res: Response) {
  const { old_password, new_password } = req.body;

  try {
    const user = await User.getById(res.locals.user_id);
    if (!user) {
      return respond(res, 500, "InternalError");
    }

    if (!user.email) {
      // cannot update password for a temporary user
      return respond(res, 400, "TempUser");
    }
    if (generateHmac(old_password, user.email) !== user.password) {
      return respond(res, 400, "WrongPassword");
    }
    await user.setPassword(new_password).updatePassword();
    return respond(res, 204, "Updated");
  } catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }

}

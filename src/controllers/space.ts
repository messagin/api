import { Request, Response } from "express";
import { respond } from "../utils/respond";
import { log } from "../utils/log";
import { Space } from "../schemas/Space";
import { User } from "../schemas/User";
import { Emitter } from "../utils/events";

export async function getById(req: Request, res: Response) {
  try {
    const id = req.params.space_id;
    const space = await Space.getById(id);

    if (!space || space.hasFlag("Deleted") || !space.members.has(res.locals.user_id)) {
      return respond(res, 404, "NotFound");
    }

    const chats = await space.chats.list();
    return respond(res, 200, "Ok", { ...space, chats });
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function get(_req: Request, res: Response) {
  const user = await User.getById(res.locals.user_id);
  if (!user) {
    return respond(res, 500, "InternalError");
  }
  const spaces = await user.spaces.list();
  const filtered = spaces.filter(space => !space.hasFlag("Deleted"));

  return respond(res, 200, "Ok", filtered);
}

export async function destroy(req: Request, res: Response) {
  try {
    const space = await Space.getById(req.params.space_id);
    if (!space || space.hasFlag("Deleted")) {
      return respond(res, 404, "NotFound");
    }
    if (space.owner_id !== res.locals.user_id) {
      return respond(res, 403, "NotOwner");
    }

    const emitter = Emitter.getInstance();

    emitter.emit("SpaceDelete", space);

    // no await to run in background
    await space.delete();

    return respond(res, 204, "Deleted");
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function create(req: Request, res: Response) {
  try {
    const user = new User(res.locals.user_id);
    const space = user.spaces.init(req.body.name);
    await space.create();

    const member = space.members.init(res.locals.user_id);
    await member.create();

    const chat = space.chats.init("main");
    await chat.create();

    const emitter = Emitter.getInstance();
    emitter.emit("SpaceCreate", space)
      .emit("MemberCreate", member.clean())
      .emit("ChatCreate", chat);

    return respond(res, 201, "SpaceCreated", space);
  }
  catch (err) {
    log("red")((err as Error).message);
    respond(res, 500, "InternalError");
    return;
  }
}

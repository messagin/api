import { Request, Response } from "express";
import { respond } from "../utils/respond";
import { log } from "../utils/log";
import { Space } from "../models/Space";
import { User } from "../models/User";
import { Emitter } from "../utils/events";

export async function getById(req: Request, res: Response) {
  const id = req.params.space_id;

  let space;
  try {
    space = await Space.getById(id);
  } catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }

  if (!space) {
    return respond(res, 404, "NotFound");
  }

  const chats = await space.chats.list();

  return respond(res, 200, "Ok", { ...space, chats });
}

export async function get(_req: Request, res: Response) {
  const user = await User.getById(res.locals.user_id);
  if (!user) {
    return respond(res, 500, "InternalError");
  }
  const spaces = await user.spaces.list();
  return respond(res, 200, "Ok", spaces);
}

export async function destroy(req: Request, res: Response) {
  const space = await Space.getById(req.params.space_id);
  if (!space) {
    return respond(res, 404, "NotFound");
  }
  if (space.owner_id !== res.locals.user_id) {
    return respond(res, 403, "NotOwner");
  }

  respond(res, 204, "Deleted");

  await space.delete();
}

export async function create(req: Request, res: Response) {
  try {
    // todo modify

    const space = new Space()
      .setName(req.body.name)
      .setOwner(res.locals.user_id);

    await space.create();

    const member = await space.members.create(res.locals.user_id);

    Emitter.getInstance()
      .emit("SpaceCreate", space)
      .emit("MemberCreate", member.clean());

    respond(res, 201, "SpaceCreated", space);
    return;
  } catch (err) {
    log("red")((err as Error).message);
    respond(res, 500, "InternalError");
    return;
  }
}

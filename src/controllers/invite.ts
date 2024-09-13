import { Request, Response } from "express";
import { respond } from "../utils/respond";
import { Invite } from "../schemas/Invite";
import { Space } from "../schemas/Space";
import { Emitter } from "../utils/events";
import { log } from "../utils/log";

export async function create(req: Request, res: Response) {
  try {
    // todo fix
    const invite = new Invite()
      .setSpace(req.params.space_id);

    await invite.create();
    
    Emitter.getInstance().emit("InviteCreate", invite);
    return respond(res, 201, "InviteCreated", invite);
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const invite = await Invite.getById(req.params.invite_id);
    if (!invite) {
      return respond(res, 404, "NotFound");
    }

    return respond(res, 200, "Ok", invite);
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function get(req: Request, res: Response) {
  try {
    const space = await Space.getById(req.params.space_id);
    if (!space) {
      return respond(res, 404, "NotFound");
    }
    const invites = await space.invites.list();
    return respond(res, 200, "Ok", invites);
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function accept(req: Request, res: Response) {
  try {
    const invite = await Invite.getById(req.params.invite_id);
    if (!invite) {
      return respond(res, 404, "NotFound");
    }
    // avoid using Space.getById for less db calls
    const space = new Space(invite.space_id);
    const isMember = await space.members.has(res.locals.user_id);
    if (isMember) {
      return respond(res, 409, "ExistingMember")
    }
    const member = await space.members.init(res.locals.user_id);
    await invite.update();

    Emitter.getInstance().emit("MemberCreate", member);
    // emitter.emit("InviteUpdate", invite);

    return respond(res, 201, "MemberCreated");
  }
  catch (err) {
    log("red")((err as Error).message)
    return respond(res, 500, "InternalError");
  }
}

export async function destroy(req: Request, res: Response) {
  try {
    const invite = await Invite.getById(req.params.invite_id);
    if (!invite) {
      return respond(res, 404, "NotFound");
    }

    await invite.destroy();

    Emitter.getInstance().emitter.emit("InviteDelete", invite);
    return respond(res, 204, "Deleted", invite);
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

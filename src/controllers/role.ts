import { Request, Response } from "express";
import { respond } from "../utils/respond";
import { log } from "../utils/log";
import { Emitter } from "../utils/events";
import { Space } from "../schemas/Space";
import { Role } from "../schemas/Role";

export async function create(req: Request, res: Response) {
  try {
    const space = await Space.getById(req.params.space_id);
    if (!space) {
      return respond(res, 404, "NotFound");
    }
    const role = space.roles.init(req.body.name);
    await role.create();

    Emitter.getInstance().emit("RoleCreate", role);
    return respond(res, 201, "RoleCreated", role);
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

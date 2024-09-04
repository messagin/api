import { Request, Response } from "express";
import { respond } from "../utils/respond";
import { log } from "../utils/log";
import { Relation } from "../schemas/Relation";
import { User } from "../schemas/User";

export async function get(_req: Request, res: Response) {
  const user = await User.getById(res.locals.user_id);
  if (!user) {
    return respond(res, 500, "InternalError");
  }
  const relations = await user.relations.list();

  return respond(res, 200, "Ok", relations);
}

export async function create(req: Request, res: Response) {
  try {
    const user_exists = await User.id_exists(req.params.user_id);
    if (!user_exists) {
      return respond(res, 404, "NotFound");
    }
    const relation = new Relation()
      .setUsers(res.locals.user_id, req.params.user_id);

    await relation.create();

    return respond(res, 201, "RelationCreated");
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const exists = await User.id_exists(req.params.user_id);
    if (!exists) {
      return respond(res, 404, "NotFound");
    }
    const relation = await Relation.getByIds(res.locals.user_id, req.params.user_id);
    if (!relation) {
      return respond(res, 404, "NotFound");
    }

    return respond(res, 200, "Ok", relation.clean(res.locals.user_id));
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function destroy(_req: Request, res: Response) {
  try {
    // FIX end the friendController.destroy function
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

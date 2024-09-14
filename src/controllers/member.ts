import { Request, Response } from "express";
// import db from "../utils/database";
import { respond } from "../utils/respond";
import { Space } from "../schemas/Space";
import { User } from "../schemas/User";

export async function add(req: Request, res: Response) {
  const space = await Space.getById(req.params.space_id);
  if (!space) {
    return respond(res, 404, "NotFound");
  }
  const user = await User.getById(req.params.member_id);
  if (!user) {
    return respond(res, 404, "NotFound");
  }
  
  const member = space.members.init(user.id);
  await member.create();
  
  return respond(res, 201, "MemberCreated", member.clean());
}

export async function get(req: Request, res: Response) {
  const space = await Space.getById(req.params.space_id);
  if (!space) {
    return respond(res, 404, "NotFound");
  }
  const members = await space.members.list();

  respond(res, 200, "Ok", members?.map(m => m.clean()));
}

export async function getById(req: Request, res: Response) {
  const space = await Space.getById(req.params.space_id);
  if (!space) {
    return respond(res, 404, "NotFound");
  }
  const member = await space.members.get(req.params.member_id);
  if (!member) {
    return respond(res, 404, "NotFound");
  }

  respond(res, 200, "Ok", member?.clean());
}

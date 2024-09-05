import { Request, Response } from "express";
// import db from "../utils/database";
import { respond } from "../utils/respond";
import { Space } from "../schemas/Space";

export async function get(req: Request, res: Response) {
  const space = await Space.getById(req.params.space_id);
  const members = await space?.members.list();

  respond(res, 200, "Ok", members?.map(m => m.clean()));
}

export async function getById(req: Request, res: Response) {
  const space = await Space.getById(req.params.space_id);
  const member = await space?.members.get(req.params.member_id);

  respond(res, 200, "Ok", member?.clean());
}

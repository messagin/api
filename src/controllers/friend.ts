import { Request, Response } from "express";
// import db from "../utils/database";
import { respond } from "../utils/respond";
import { log } from "../utils/log";

export function get(req: Request, res: Response) {
  // db.friends

  log("white")(req.params.friend_id);
  respond(res, 200, "Ok");
}

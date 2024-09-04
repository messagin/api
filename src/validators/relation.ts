import { Request, Response, NextFunction } from "express";
import { respond } from "../utils/respond";

const id_regex = /^[0-9A-HJKMNP-TV-Z]{16}$/;

export async function create(req: Request, res: Response, next: NextFunction) {
  if (!id_regex.test(req.params.user_id)) {
    return respond(res, 400, "MalformedId");
  }
  return next();
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  if (!id_regex.test(req.params.user_id)) {
    return respond(res, 400, "MalformedId");
  }
  return next();
}

export async function destroy(req: Request, res: Response, next: NextFunction) {
  if (!id_regex.test(req.params.user_id)) {
    return respond(res, 400, "MalformedId");
  }
  return next();
}

import { Request, Response, NextFunction } from "express";
import { respond } from "../utils/respond";

export function get(req: Request, res: Response, next: NextFunction) {
  if (!/^[0-9A-HJKMNP-TV-Z]{16}$/.test(req.params.space_id)) {
    return respond(res, 400, "MalformedId");
  }
  return next();
}

export function getById(req: Request, res: Response, next: NextFunction) {
  if (!/^[0-9A-HJKMNP-TV-Z]{16}$/.test(req.params.space_id)) {
    return respond(res, 400, "MalformedId");
  }
  if (!/^[0-9A-HJKMNP-TV-Z]{16}$/.test(req.params.member_id)) {
    return respond(res, 400, "MalformedId");
  }
  return next();
}

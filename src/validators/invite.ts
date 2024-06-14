import { Request, Response, NextFunction } from "express";
import { respond } from "../utils/respond";

const id_regex = /^[0-9A-HJKMNP-TV-Z]{16}$/

export function create(req: Request, res: Response, next: NextFunction) {
  if (!id_regex.test(req.params.space_id)) {
    return respond(res, 400, "MalformedId");
  }
  return next();
}

export function getById(req: Request, res: Response, next: NextFunction) {
  if (!id_regex.test(req.params.invite_id)) {
    return respond(res, 400, "MalformedId");
  }
  return next();
}

export function get(req: Request, res: Response, next: NextFunction) {
  if (!id_regex.test(req.params.space_id)) {
    return respond(res, 400, "MalformedId");
  }
  return next();
}

export function accept(req: Request, res: Response, next: NextFunction) {
  if (!id_regex.test(req.params.invite_id)) {
    return respond(res, 400, "MalformedId");
  }
  return next();
}

export function destroy(req: Request, res: Response, next: NextFunction) {
  if (!id_regex.test(req.params.invite_id)) {
    return respond(res, 400, "MalformedId");
  }
  return next();
}

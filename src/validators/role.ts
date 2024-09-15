import { Request, Response, NextFunction } from "express";
import { respond } from "../utils/respond";

type ValueError = "missing" | "invalid";

const id_regex = /^[0-9A-HJKMNP-TV-Z]{16}$/;

export function create(req: Request, res: Response, next: NextFunction) {
  const errors: { name?: ValueError } = {};
  if (!id_regex.test(req.params.space_id)) {
    return respond(res, 400, "MalformedId");
  }

  if (!req.body?.name) {
    errors.name = "missing";
  }
  else if (typeof req.body.name !== "string" || req.body.name.length < 2) {
    errors.name = "invalid";
  }

  if (Object.keys(errors).length) {
    return respond(res, 400, "InvalidBody", { errors });
  }
  return next();
}

export function destroy(req: Request, res: Response, next: NextFunction) {
  if (!id_regex.test(req.params.space_id)) {
    return respond(res, 400, "MalformedId");
  }
  if (!id_regex.test(req.params.role_id)) {
    return respond(res, 400, "MalformedId");
  }
  return next();
}

import { Request, Response, NextFunction } from "express";
import { respond } from "../utils/respond";

type ValueError = "missing" | "invalid";

export function getById(req: Request, res: Response, next: NextFunction) {
  if (!/^[0-9A-HJKMNP-TV-Z]{16}$/.test(req.params.user_id)) {
    return respond(res, 400, "MalformedId");
  }
  return next();
}

export function createTrial(req: Request, res: Response, next: NextFunction) {
  if (!req.body?.username) {
    return respond(res, 400, "InvalidBody");
  }
  return next();
}

export function create(req: Request, res: Response, next: NextFunction) {
  const errors: { username?: ValueError, email?: ValueError, password?: ValueError } = {};

  if (!req.body?.username) {
    errors.username = "missing";
  }
  else if (typeof req.body?.username !== "string" || req.body?.username?.length < 2) {
    errors.username = "invalid";
  }

  if (!req.body?.email) {
    errors.email = "missing";
  }
  else if (!/.+@.+/.test(req.body?.email)) {
    errors.email = "invalid";
  }

  if (!req.body?.password) {
    errors.password = "missing";
  }
  else if (typeof req.body?.password !== "string" || req.body?.password?.length < 8) {
    errors.password = "invalid";
  }

  if (Object.keys(errors).length) {
    return respond(res, 400, "InvalidBody", { errors });
  }
  return next();
}

export function login(req: Request, res: Response, next: NextFunction) {
  if (req.body?.token) {
    return next();
  }

  const errors: { email?: ValueError, password?: ValueError } = {};

  if (!req.body?.email) {
    errors.email = "missing";
  }
  else if (typeof req.body?.email !== "string" || req.body?.email?.length < 2) {
    errors.email = "invalid";
  }

  if (!req.body?.password) {
    errors.password = "missing";
  }
  else if (typeof req.body?.password !== "string" || req.body?.password?.length < 8) {
    errors.password = "invalid";
  }

  if (Object.keys(errors).length) {
    return respond(res, 400, "InvalidBody", { errors });
  }
  return next();
}

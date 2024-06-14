import { Request, Response, NextFunction } from "express";
import { respond } from "../utils/respond";

const id_regex = /^[0-9A-HJKMNP-TV-Z]{16}$/

export function destroy(req: Request, res: Response, next: NextFunction) {
  if (!id_regex.test(req.params.chat_id)) {
    return respond(res, 400, "MalformedId");
  }
  if (!id_regex.test(req.params.message_id)) {
    return respond(res, 400, "MalformedId");
  }
  return next();
}

export function get(req: Request, res: Response, next: NextFunction) {
  if (!id_regex.test(req.params.chat_id)) {
    return respond(res, 400, "MalformedId");
  }
  return next();
}

export function update(req: Request, res: Response, next: NextFunction) {
  if (!id_regex.test(req.params.chat_id)) {
    return respond(res, 400, "MalformedId");
  }
  if (!id_regex.test(req.params.message_id)) {
    return respond(res, 400, "MalformedId");
  }
  if (!req.body.content || typeof req.body.content !== "string" || req.body.content.length > 4000) {
    return respond(res, 400, "InvalidBody");
  }
  return next();
}

export function search(req: Request, res: Response, next: NextFunction) {
  if (!id_regex.test(req.params.chat_id)) {
    return respond(res, 400, "MalformedId");
  }
  // todo validate (and implement) advanced search parameters
  if (!req.query.q || typeof req.query.q !== "string" || req.query.q.length > 2000) {
    return respond(res, 400, "InvalidBody");
  }
  const limit = Number(req.query.limit);
  if (limit && (limit != ~~limit || limit > 50 || limit < 1)) {
    return respond(res, 400, "InvalidBody");
  }
  return next();
}

export function getById(req: Request, res: Response, next: NextFunction) {
  if (!id_regex.test(req.params.chat_id)) {
    return respond(res, 400, "MalformedId");
  }
  if (!id_regex.test(req.params.message_id)) {
    return respond(res, 400, "MalformedId");
  }
  return next();
}

export function create(req: Request, res: Response, next: NextFunction) {
  if (!id_regex.test(req.params.chat_id)) {
    return respond(res, 400, "MalformedId");
  }
  if (!req.body.content || typeof req.body.content !== "string" || req.body.content.length > 4000) {
    return respond(res, 400, "InvalidBody");
  }
  return next();
}

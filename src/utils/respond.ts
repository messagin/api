import { Response } from "express";
import db from "./database";
import { ExtendedStatusCodes, StatusCode, StatusCodeMessage, StatusCodes, StatusMessages } from "./status";
import { ResLocals } from "./locals";

export async function respond<T extends StatusCode>(resp: Response, status: T, code: StatusCodeMessage<T>, data?: unknown) {
  const res = resp as Response<unknown, ResLocals>;
  const c = StatusCodes[status][code] as ExtendedStatusCodes;

  const response = data === undefined ? {
    message: StatusMessages[c]
  } : data;

  // todo: rate limit all requests

  if (status === 401 || status === 403) {
    // rate limit unauthorized requests (by IP)
    await db.execute("UPDATE ip_rate_limits SET count = count + 1 WHERE ip = ? AND created_at = ?", [res.req.ip, res.locals.rateLimit.created_at], { prepare: true });
    res.locals.rateLimit.remaining--;
  }
  if (res.locals.user?.id && status === 429) {
    // rate limit the application (by ID)
    // if too many 429 requests, reset the application token
  }
  // if (stat)

  if (res.locals.rateLimit) {
    const { limit, remaining, reset, type } = res.locals.rateLimit;
    res.set("X-RateLimit-Limit", limit.toString());
    res.set("X-RateLimit-Remaining", remaining.toString());
    res.set("X-RateLimit-Reset", reset.toString());
    res.set("X-RateLimit-Type", type);
  }

  res.status(status).json(response);
}

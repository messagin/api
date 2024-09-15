import { Request, Response, NextFunction } from "express";
import db from "./database";
import { respond } from "./respond";
import { log } from "./log";
import { ResLocals } from "./locals";

// x-ratelimit-limit: 60
// x-ratelimit-remaining: 59
// x-ratelimit-reset: 1688320872
// x-ratelimit-used: 1

const WINDOW_SIZE = 24 * 60 * 60; // 1 day
const MAX_REQUESTS = 1000; // Max invalid requests per window size

export async function rateLimitByIp(_req: Request, res: Response<unknown, ResLocals>, next: NextFunction) {
  const ip = res.locals.ip;

  const now = Date.now();

  try {
    let data = (await db.execute("SELECT * FROM ip_rate_limits WHERE ip = ?", [ip], { prepare: true })).rows[0] as unknown as { count: number, created_at: number, type: string, id: string | null, ip: string | null };

    if (!data) {
      await db.execute("UPDATE ip_rate_limits SET count = count + 1 WHERE ip = ? AND created_at = ?", [ip, now], { prepare: true });
      data = { count: 0, created_at: now, ip, type: "ip", id: null };
    }

    res.locals.rateLimit = {
      limit: MAX_REQUESTS,
      remaining: MAX_REQUESTS - data.count,
      reset: Math.floor(data.created_at / 1000) + WINDOW_SIZE,
      created_at: data.created_at,
      type: "ip"
    };

    if (data.count >= MAX_REQUESTS) {
      await respond(res, 429, "RateLimited");
      return;
    }

    next();
    return;
  }
  catch (err) {
    log("red")(__filename, (err as Error).message)
    await respond(res, 500, "InternalError");
    return;
  }
}

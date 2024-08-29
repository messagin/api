import { Request, Response, NextFunction } from "express";
import db from "./database";
import { respond } from "./respond";
import { log } from "./log";
import { eqLessThan } from "scyllo";

// x-ratelimit-limit: 60
// x-ratelimit-remaining: 59
// x-ratelimit-reset: 1688320872
// x-ratelimit-used: 1

const WINDOW_SIZE = 24 * 60 * 60; // 1 day
const MAX_REQUESTS = 1000; // Max invalid requests per window size

export async function rateLimitByIp(_req: Request, res: Response, next: NextFunction) {
  const ip = res.locals.ip as string;

  const now = Math.floor(Date.now() / 1000);
  const start = now - WINDOW_SIZE;

  try {
    await db.deleteFrom("rate_limits", "*", { created_at: eqLessThan(start), type: "ip" });
    // await db.ratelimits.where("created_at", "<", start).andWhere("type", "ip").del();

    let data = await db.selectOneFrom("rate_limits", "*", { ip });
    // let data = await db.ratelimits.where({ ip }).first();

    if (!data) {
      await db.insertInto("rate_limits", { ip, created_at: now, count: 0, type: "ip" });
      // await db.ratelimits.insert({ ip, created_at: now, count: 0, type: "ip" });
      data = { count: 0, created_at: now, ip, type: "ip", id: null };
    }

    res.locals.rateLimit = {
      limit: MAX_REQUESTS,
      remaining: MAX_REQUESTS - data.count,
      reset: data.created_at + WINDOW_SIZE,
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
    log("red")((err as Error).message)
    await respond(res, 500, "InternalError");
    return;
  }
}

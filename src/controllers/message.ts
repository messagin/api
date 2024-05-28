import { Request, Response } from "express";
import { respond } from "../utils/respond";
import { log } from "../utils/log";
import { Emitter } from "../utils/events";
import { Chat } from "../models/Chat";

export async function create(req: Request, res: Response) {
  try {
    const chat = await Chat.getById(req.params.chat_id);
    if (!chat) {
      return respond(res, 404, "NotFound");
    }

    const message = await chat.messages.create(res.locals.user_id);
    Emitter.getInstance().emit("MessageCreate", message.clean());
    return respond(res, 201, "MessageCreated", message.clean());
  } catch (err) {
    log("red")((err as Error).message);
    respond(res, 500, "InternalError");
  }
}

export async function get(req: Request, res: Response) {
  try {
    const chat = await Chat.getById(req.params.chat_id);
    if (!chat) {
      return respond(res, 404, "NotFound");
    }

    const messages = await chat.messages.list();
    return respond(
      res,
      200,
      "Ok",
      messages.map((m) => m.clean()),
    );
  } catch (err) {
    log("red")((err as Error).message);
    respond(res, 500, "InternalError");
  }
}

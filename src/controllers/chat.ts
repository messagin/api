import { Request, Response } from "express";
import { respond } from "../utils/respond";
import { generateIDv2 } from "../utils/auth";
import db from "../utils/database";
import { log } from "../utils/log";
import { Emitter } from "../utils/events";
import { Space } from "../models/Space";

// const { Chat } = require("../models/chat");

export async function create(req: Request, res: Response) {
  const id = generateIDv2();
  try {
    // todo modify
    const chat = { id, name: req.body.name, space_id: req.params.space_id };

    await db.chats.insert(chat);

    Emitter.getInstance().emit("ChatCreate", chat);

    return respond(res, 201, "ChatCreated", chat);
  } catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function get(req: Request, res: Response) {
  try {
    const chats = await new Space(req.params.space_id).chats.list();
    return respond(res, 200, "Ok", chats);
  } catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const chat = await db.chats.where({ id: req.params.chat_id });
    return respond(res, 200, "Ok", chat);
  } catch (err) {
    log("red")((err as Error).message);
    respond(res, 500, "InternalError");
  }
}

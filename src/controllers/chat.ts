import { Request, Response } from "express";
import { respond } from "../utils/respond";
import { log } from "../utils/log";
import { Emitter, Events } from "../utils/events";
import { Chat, ChatTypes } from "../schemas/Chat";
import { Space } from "../schemas/Space";

export async function create(req: Request, res: Response) {
  try {
    const chat = await new Chat(ChatTypes.TEXT)
      .setName(req.body.name)
      .setSpace(req.params.space_id)
      .create();

    Emitter.getInstance().emit(Events.ChatCreate, chat);
    return respond(res, 201, "ChatCreated", chat);
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function destroy(req: Request, res: Response) {
  try {
    const chat = await Chat.getById(req.params.chat_id);
    if (!chat) {
      return respond(res, 404, "NotFound");
    }
    const space = new Space(chat.space_id);
    const is_member = space.members.has(res.locals.user.id);
    if (!is_member) {
      return respond(res, 403, "Forbidden");
    }

    const emitter = Emitter.getInstance();
    emitter.emit(Events.ChatDelete, chat);

    await chat.delete();

    return respond(res, 204, "Deleted");
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function update(req: Request, res: Response) {
  try {
    const chat = await Chat.getById(req.params.chat_id);
    if (!chat) {
      return respond(res, 404, "NotFound");
    }
    await chat.setName(req.body.name).update();

    const emitter = Emitter.getInstance();
    emitter.emit(Events.ChatUpdate, chat);

    return respond(res, 204, "Updated");

  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const chat = await Chat.getById(req.params.chat_id);
    if (!chat) {
      return respond(res, 404, "NotFound");
    }
    return respond(res, 200, "Ok", chat.clean());
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function get(req: Request, res: Response) {
  try {
    const chats = await new Space(req.params.space_id).chats.list();
    return respond(res, 200, "Ok", chats);
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

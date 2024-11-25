import { Request, Response } from "express";
import { respond } from "../utils/respond";
import { log } from "../utils/log";
import { Emitter, Events } from "../utils/events";
import { Chat, ChatTypes } from "../schemas/Chat";
import { User } from "../schemas/User";

export async function create(req: Request, res: Response) {
  try {
    const chat = await new Chat(ChatTypes.DM)
      .setName(req.body.name)
      .create();
    Emitter.getInstance().emit(Events.ChatCreate, chat.clean());
    await chat.members.init(res.locals.user.id).create();

    return respond(res, 201, "ChatCreated", chat.clean());
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
    const is_member = chat.members.has(res.locals.user.id);
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

// export async function update(req: Request, res: Response) {
//   try {
//     const chat = await Chat.getById(req.params.chat_id);
//     if (!chat) {
//       return respond(res, 404, "NotFound");
//     }
//     await chat.setName(req.body.name).update();

//     const emitter = Emitter.getInstance();
//     emitter.emit(Events.ChatUpdate, chat);

//     return respond(res, 204, "Updated");

//   }
//   catch (err) {
//     log("red")((err as Error).message);
//     return respond(res, 500, "InternalError");
//   }
// }

export async function getById(req: Request, res: Response) {
  try {
    const chat = await Chat.getById(req.params.chat_id);
    if (!chat) {
      return respond(res, 404, "NotFound");
    }
    console.log(chat);
    return respond(res, 200, "Ok", chat.clean());
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function get(_req: Request, res: Response) {
  try {
    // todo change
    const chats = await new User(res.locals.user.id).chats.list();

    return respond(res, 200, "Ok", chats);
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

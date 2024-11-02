import { Request, Response } from "express";
import { respond } from "../utils/respond";
import { log } from "../utils/log";
import { Emitter } from "../utils/events";
import { UserChat } from "../schemas/Chat";
import db from "../utils/database";
import { User } from "../schemas/User";

export async function create(req: Request, res: Response) {
  try {
    const chat = await new UserChat()
      .setName(req.body.name)
      .create();

    await db.execute("INSERT INTO messagin.chat_members (chat_id,user_id,flags,created_at) VALUES (?,?,?,?)", [chat.id, res.locals.user.id, 0, Date.now()])

    Emitter.getInstance().emit("ChatCreate", chat);
    return respond(res, 201, "ChatCreated", chat);
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function destroy(req: Request, res: Response) {
  try {
    const chat = await UserChat.getById(req.params.chat_id);
    if (!chat) {
      return respond(res, 404, "NotFound");
    }
    const is_member = chat.members.has(res.locals.user.id);
    if (!is_member) {
      return respond(res, 403, "Forbidden");
    }

    const emitter = Emitter.getInstance();
    emitter.emit("ChatDelete", chat);

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
//     emitter.emit("ChatUpdate", chat);

//     return respond(res, 204, "Updated");

//   }
//   catch (err) {
//     log("red")((err as Error).message);
//     return respond(res, 500, "InternalError");
//   }
// }

export async function getById(req: Request, res: Response) {
  try {
    const chat = await UserChat.getById(req.params.chat_id);
    return respond(res, 200, "Ok", chat);
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

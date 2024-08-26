import { Request, Response } from "express";
import { respond } from "../utils/respond";
import { log } from "../utils/log";
import { Emitter } from "../utils/events";
import { Chat } from "../schemas/Chat";
import db from "../utils/database";
import { User } from "../schemas/User";

// const { Chat } = require("../models/chat");

export async function create(req: Request, res: Response) {
  try {
    const chat = await new Chat()
      .setName(req.body.name)
      .create();

    db.chatMembers.insert({
      chat_id: chat.id,
      user_id: res.locals.user_id,
      flags: 0,
      created_at: Date.now()
    })

    Emitter.getInstance().emit("ChatCreate", chat);
    return respond(res, 201, "ChatCreated", chat);
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

// export async function destroy(req: Request, res: Response) {
//   try {
//     const chat = await Chat.getById(req.params.chat_id);
//     if (!chat) {
//       return respond(res, 404, "NotFound");
//     }
//     const is_member = space.members.has(res.locals.user_id);
//     if (!is_member) {
//       return respond(res, 403, "Forbidden");
//     }

//     const emitter = Emitter.getInstance();
//     emitter.emit("ChatDelete", chat);

//     await chat.delete();

//     return respond(res, 204, "Deleted");
//   }
//   catch (err) {
//     log("red")((err as Error).message);
//     return respond(res, 500, "InternalError");
//   }
// }

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
    const chat = await Chat.getById(req.params.chat_id);
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
    const chats = await new User(res.locals.user_id).chats.list();

    return respond(res, 200, "Ok", chats);
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

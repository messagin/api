import { Request, Response } from "express";
import { respond } from "../utils/respond";
import { log } from "../utils/log";
import { Emitter } from "../utils/events";
import { SpaceChat } from "../schemas/Chat";
import { Member } from "../schemas/Member";
import { Message } from "../schemas/Message";
import { Space } from "../schemas/Space";

export async function create(req: Request, res: Response) {
  try {
    const chat = await SpaceChat.getById(req.params.chat_id);
    if (!chat) {
      return respond(res, 404, "NotFound");
    }
    const member = await Member.get(chat.space_id, res.locals.user_id);
    console.log(chat, member);
    if (!member) {
      return respond(res, 403, "Forbidden");
    }

    const message = (await chat.messages.create(res.locals.user_id, req.body.content)).clean();
    Emitter.getInstance().emit("MessageCreate", message);

    return respond(res, 201, "MessageCreated", message);
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function get(req: Request, res: Response) {
  try {
    const chat = await SpaceChat.getById(req.params.chat_id);
    if (!chat) {
      return respond(res, 404, "NotFound");
    }

    const messages = await chat.messages.list();
    return respond(res, 200, "Ok", messages.map(m => m.clean()));
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function destroy(req: Request, res: Response) {
  try {
    const message = await Message.getById(req.params.message_id);
    if (!message || message.chat_id !== req.params.chat_id) {
      return respond(res, 404, "NotFound");
    }
    // todo check permissions to delete message
    // for now only authors can delete
    if (message.user_id !== res.locals.user_id) {
      return respond(res, 403, "Forbidden");
    }

    await message.delete();
    const emitter = new Emitter();
    emitter.emit("MessageDelete", message.clean());

    return respond(res, 204, "Deleted");
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function update(req: Request, res: Response) {
  try {
    const message = await Message.getById(req.params.message_id);
    if (!message || message.chat_id !== req.params.chat_id) {
      return respond(res, 404, "NotFound");
    }
    if (message.user_id !== res.locals.user_id) {
      return respond(res, 403, "Forbidden");
    }

    await message.setContent(req.body.content)
      .update();
    const emitter = Emitter.getInstance();
    emitter.emit("MessageUpdate", message.clean());

    return respond(res, 204, "Updated");
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function search(req: Request, res: Response) {
  try {
    const chat = await SpaceChat.getById(req.params.chat_id);
    if (!chat) {
      return respond(res, 404, "NotFound");
    }
    const space = new Space(chat.space_id!);
    const is_member = space.members.has(res.locals.user_id);

    if (!is_member) {
      return respond(res, 403, "Forbidden");
    }

    const search_options = {
      query: req.query.q as string,
      limit: Number(req.query.limit) || 0 // was validated
    };

    await chat.messages.search(search_options);
    return respond(res, 200, "Ok", null);
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}


export async function getById(req: Request, res: Response) {
  try {
    const chat = new SpaceChat(req.params.chat_id);
    if (!chat) {
      return respond(res, 404, "NotFound");
    }
    const message = await Message.getById(req.params.message_id);
    if (!message || message.chat_id !== chat.id) {
      return respond(res, 404, "NotFound");
    }
    return respond(res, 200, "Ok", message.clean());
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

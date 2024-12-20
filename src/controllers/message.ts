import { Request, Response } from "express";
import { respond } from "../utils/respond";
import { log } from "../utils/log";
import { Emitter, Events } from "../utils/events";
import { Chat } from "../schemas/Chat";
import { Member } from "../schemas/Member";
import { Message } from "../schemas/Message";
import { Space } from "../schemas/Space";
import { ResLocals } from "../utils/locals";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import Busboy from "busboy";

const filenameRegex = /^(?!.*[/\\])[^<>:"|?*\r\n]+$/;

export async function create(req: Request, res: Response<unknown, ResLocals>) {
  try {
    if (!res.locals.user) {
      return respond(res, 500, "InternalError");
    }
    const chat = await Chat.getById(req.params.chat_id);
    if (!chat) {
      return respond(res, 404, "NotFound");
    }
    const member = await Member.get(chat.space_id, res.locals.user.id);
    if (!member) {
      return respond(res, 403, "Forbidden");
    }

    const message = (await chat.messages.create(res.locals.user.id, req.body))
      .setUserData({ id: res.locals.user.id, username: res.locals.user.username })
      .clean();
    Emitter.getInstance().emit(Events.MessageCreate, message);

    return respond(res, 201, "MessageCreated", message);
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function get(req: Request, res: Response) {
  try {
    const chat = await Chat.getById(req.params.chat_id);
    if (!chat) {
      return respond(res, 404, "NotFound");
    }

    const messages = await chat.messages.list();
    return respond(res, 200, "Ok", messages);
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
    if (message.user_id !== res.locals.user.id) {
      return respond(res, 403, "Forbidden");
    }

    await message.delete();
    const emitter = new Emitter();
    emitter.emit(Events.MessageDelete, {
      id: message.id,
      chat_id: message.chat_id
    });

    return respond(res, 204, "Deleted");
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function update(req: Request, res: Response<unknown, ResLocals>) {
  try {
    const message = await Message.getById(req.params.message_id);
    if (!message || message.chat_id !== req.params.chat_id) {
      return respond(res, 404, "NotFound");
    }
    if (message.user_id !== res.locals.user?.id) {
      return respond(res, 403, "Forbidden");
    }

    await message.setContent(req.body.content)
      .setUserData({ id: res.locals.user.id, username: res.locals.user.username })
      .update();
    const emitter = Emitter.getInstance();
    emitter.emit(Events.MessageUpdate, message.clean());

    return respond(res, 204, "Updated");
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function search(req: Request, res: Response) {
  try {
    const chat = await Chat.getById(req.params.chat_id);
    if (!chat) {
      return respond(res, 404, "NotFound");
    }
    if (!chat.isTextChat()) {
      return respond(res, 403, "Forbidden");
    }

    const space = new Space(chat.space_id!);
    const is_member = space.members.has(res.locals.user.id);

    if (!is_member) {
      return respond(res, 403, "Forbidden");
    }

    const search_options = {
      query: req.query.q as string,
      limit: Number(req.query.limit) || 10 // was validated
    };

    const messages = await chat.messages.search(search_options);
    return respond(res, 200, "Ok", messages);
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
    const message = await Message.getById(req.params.message_id);
    if (!message || message.chat_id !== chat.id) {
      return respond(res, 404, "NotFound");
    }
    return respond(res, 200, "Ok", message.setUserData(await message.getUserData()).clean());
  }
  catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function getAttachment(req: Request, res: Response) {
  try {
    const message = await Message.getById(req.params.message_id);
    if (!message) {
      return respond(res, 404, "NotFound");
    }
    if (!filenameRegex.test(req.params.filename)) {
      return respond(res, 400, "InvalidBody");
    }

    const dir = message.id.slice(0, 4);
    const file = message.id.slice(4) + req.params.filename;
    const path = `/messagin-data/${dir}/${file}`;

    res.header("Cache-Control", "public, max-age=31536000");

    const exists = existsSync(path);
    if (!exists) {
      res.status(404).end("File not found");
      return;
    }
    res.sendFile(path);
  } catch (err) {
    log("red")((err as Error).message);
    return respond(res, 500, "InternalError");
  }
}

export async function createAttachment(req: Request, res: Response) {
  if (!req.is('multipart/form-data')) {
    return respond(res, 400, "InvalidContentType");
  }

  const message = new Message(req.params.message_id);
  const attachments = await message.attachments.list();
  if (!attachments.length) {
    return respond(res, 404, "NotFound");
  }

  const totalSize = Number(req.headers['content-length']);

  if (!totalSize) {
    return respond(res, 400, "InvalidBody");
  }

  res.header('Content-Type', 'text/plain');
  res.header('Transfer-Encoding', 'chunked');
  res.header('Cache-Control', 'no-cache');

  res.status(200).flushHeaders();

  const filenames = attachments.map(x => x.filename);

  const busboy = Busboy({ headers: req.headers });
  const dir = `/messagin-data/${message.id.slice(0, 4)}/`;
  const prefix = message.id.slice(4);

  let uploadSize = 0;
  let lastProgress = 0;

  busboy.on('file', async (fieldname, stream, info) => {
    if (fieldname !== "attachment") {
      const error = `ERROR: Invalid field "${fieldname}"`;
      console.error(error);
      stream.destroy();
      res.end(error);
      res.destroy();
      return;
    }

    if (!filenameRegex.test(info.filename) || !filenames.includes(info.filename)) {
      const error = `ERROR: Invalid filename "${info.filename}"`;
      console.error(error);
      stream.destroy();
      res.end(error);
      res.destroy();
      return;
    }

    await message.attachments.lock(info.filename);

    mkdirSync(dir, { recursive: true });
    const writeStream = createWriteStream(`${dir}/${prefix}${info.filename}`);

    stream.on('data', chunk => {
      uploadSize += chunk.length;
      writeStream.write(chunk);
      const progress = 100 * uploadSize / totalSize;
      if ((progress - lastProgress <= 5) && progress !== 100) return;
      lastProgress = progress;
      res.write(`${progress.toFixed(2)}\n`);
    });

    stream.on("error", async () => {
      await message.attachments.fail(info.filename);
      writeStream.destroy();
    });

    stream.on('end', () => {
      writeStream.close();
    });
  });

  busboy.on('error', error => {
    if (!res.writable) return;
    res.end(error);
    res.destroy();
  });

  busboy.on('finish', () => {
    res.write(`100.00\n`);
    res.end("SUCCESS");
  });

  req.pipe(busboy);
}

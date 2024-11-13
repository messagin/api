import { Request, Response } from "express";
import { respond } from "../utils/respond";
import { log } from "../utils/log";
import { Emitter, Events } from "../utils/events";
import { Chat } from "../schemas/Chat";
import { Member } from "../schemas/Member";
import { Message } from "../schemas/Message";
import { Space } from "../schemas/Space";
import { ResLocals } from "../utils/locals";
import { createWriteStream } from "fs";

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
    emitter.emit(Events.MessageDelete, message.clean());

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

export async function attach(req: Request, res: Response) {
  const contentType = req.headers["content-type"];
  if (!contentType || !contentType.startsWith("multipart/form-data")) {
    return respond(res, 400, "InvalidContentType");
  }

  const boundaryMatch = contentType.match(/boundary=(.+)$/);
  if (!boundaryMatch) {
    return respond(res, 400, "BoundaryNotFound");
  }
  const boundary = `--${boundaryMatch[1]}`;

  let currentFilename = '';
  let writeStream: ReturnType<typeof createWriteStream> | null = null;

  req.on("data", (chunk: Buffer) => {
    const lines = chunk.toString("binary").split("\r\n");

    for (const line of lines) {
      if (line.startsWith(boundary)) {
        if (writeStream) {
          writeStream.end();
          writeStream = null;
        }
        continue;
      }

      if (line.startsWith("Content-Disposition")) {
        const filenameMatch = line.match(/filename="(.+?)"/);

        currentFilename = filenameMatch?.[1] || '';

        if (currentFilename) {
          writeStream = createWriteStream(`/messagin-data/${currentFilename}`);
        }

        continue;
      }

      if (writeStream) {
        writeStream.write(line + '\n');
      }
    }
  });

  req.on("end", () => {
    if (writeStream) {
      writeStream.end();
    }
    res.status(201).json({ message: "File uploaded successfully" });
  });

  req.on("error", (err) => {
    if (writeStream) {
      writeStream.end();
    }
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  });
}

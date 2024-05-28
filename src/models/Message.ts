import { generateIDv2 } from "../utils/auth.node";
import db from "../utils/database";

const MessageFlags = {
  System: 1 << 0
};

type MessageFlag = keyof typeof MessageFlags;

interface BaseMessage {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  rawFlags: number;
}

export class Message implements BaseMessage {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  rawFlags: number;

  constructor(id?: string) {
    this.id = id ?? generateIDv2();
    this.chat_id = "";
    this.user_id = "";
    this.content = "";
    this.rawFlags = 0;
  }

  setChat(id: string) {
    this.chat_id = id;
    return this;
  }

  setUser(id: string) {
    this.user_id = id;
    return this;
  }

  setContent(content: string) {
    this.content = content;
    return this;
  }

  setFlags(...flags: MessageFlag[]) {
    let result = 0;
    for (const flag of flags) {
      result |= MessageFlags[flag];
    }
    this.rawFlags = result;
    return this;
  }

  setRawFlags(flags: number) {
    this.rawFlags = flags;
    return this;
  }

  get flags() {
    const result: { [K in MessageFlag]: boolean } = (Object.keys(MessageFlags) as MessageFlag[])
      .reduce((acc, flag) => {
        acc[flag] = !!(MessageFlags[flag] & this.rawFlags);
        return acc;
      }, {} as { [K in MessageFlag]: boolean });
    return result
  }

  static async getById(id: string) {
    const message = await db.messages.where({ id }).first();
    if (!message) return null;
    const message_ = new Message(message.id)
      .setChat(message.chat_id)
      .setContent(message.content)
      .setRawFlags(message.flags)
      .setUser(message.user_id);
    return message_;
  }

  clean() {
    return {
      id: this.id,
      chat_id: this.chat_id,
      user_id: this.user_id,
      content: this.content,
      flags: this.rawFlags,
    }
  }

  async create() {
    await db.messages.insert({
      chat_id: this.chat_id,
      content: this.content,
      flags: this.rawFlags,
      id: this.id,
      user_id: this.user_id
    });
    return this;
  }
}

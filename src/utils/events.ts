import { PartialUser } from "../schemas/User";
import { Types } from "./actions";

export enum Events {
  SessionCreate,
  SessionUpdate,
  SessionDelete,
  SpaceCreate,
  SpaceUpdate,
  SpaceDelete,
  ChatCreate,
  ChatUpdate,
  ChatDelete,
  MessageCreate,
  MessageUpdate,
  MessageDelete,
  RoleCreate,
  RoleUpdate,
  RoleDelete,
  MemberCreate,
  MemberUpdate,
  MemberDelete,
  InviteCreate,
  InviteUpdate,
  InviteDelete,
  Ready,
};

interface SessionEvent {
  id: string;
  user_id: string;
  created_at: string;
};

interface SessionCreateEvent extends SessionEvent {
  browser: string;
  os: string;
  ip: string;
  time: number;
  created_at: string;
};

interface SessionUpdateEvent extends SessionEvent {
  time: number;
  created_at: string;
};

// tslint:disable-next-line:no-empty-interface
interface SessionDeleteEvent extends SessionEvent { };

interface SpaceEvent {
  id: string;
  name: string;
  owner_id: string;
};

interface ChatEvent {
  space_id?: string;
  flags: number;
  id: string;
  name: string;
};

interface MessageEvent {
  id: string;
  user: PartialUser;
  chat_id: string;
  content: string;
  flags?: number;
  created_at: string;
  message_number?: number;
  public_key?: string;
};

interface RoleEvent {
  id: string;
  space_id: string;
  name: string;
  permissions: number;
  flags: number;
  created_at: string;
};

interface MemberEvent {
  space_id: string;
  user_id: string;
  permissions: number;
  color: number | null;
  created_at: string;
};

interface InviteEvent {
  id: string;
  space_id: string;
  uses: number;
  max_uses: number;
  max_age: number;
  created_at: string;
};

export interface Event extends Record<Events, unknown> {
  [Events.SessionCreate]: SessionCreateEvent;
  [Events.SessionUpdate]: SessionUpdateEvent;
  [Events.SessionDelete]: SessionDeleteEvent;
  [Events.SpaceCreate]: SpaceEvent;
  [Events.SpaceUpdate]: SpaceEvent;
  [Events.SpaceDelete]: SpaceEvent;
  [Events.ChatCreate]: ChatEvent;
  [Events.ChatUpdate]: ChatEvent;
  [Events.ChatDelete]: ChatEvent;
  [Events.MessageCreate]: MessageEvent;
  [Events.MessageUpdate]: MessageEvent;
  [Events.MessageDelete]: MessageEvent;
  [Events.RoleCreate]: RoleEvent;
  [Events.RoleUpdate]: RoleEvent;
  [Events.RoleDelete]: RoleEvent;
  [Events.MemberCreate]: MemberEvent;
  [Events.MemberUpdate]: MemberEvent;
  [Events.MemberDelete]: MemberEvent;
  [Events.InviteCreate]: InviteEvent;
  [Events.InviteUpdate]: InviteEvent;
  [Events.InviteDelete]: InviteEvent;
};

// Ensure that the Events interface has keys from EventCodes only, with the correct types

export class Emitter {
  private static instance: Emitter | null;

  private listeners: { [K in Events]?: Map<number, (data: Event[K]) => void> };
  private freeIds: { [K in Events]?: number[] };

  constructor() {
    this.listeners = {} as { [K in Events]?: Map<number, (data: Event[K]) => void> };
    this.freeIds = {} as { [K in Events]?: number[] };

    process.on("message", <K extends Events>(msg: { type: Types, code: K, data: Event[K] }) => {
      this.onMessage(msg);
    });
  }

  static getInstance(): Emitter {
    if (!Emitter.instance) {
      Emitter.instance = new Emitter();
    }
    return Emitter.instance;
  }

  private onMessage<K extends Events>(msg: { type: Types, code: K, data: Event[K] }) {
    if (msg.type === Types.Event) {
      this.internalEmit(msg.code, msg.data);
    }
  }

  private internalEmit<K extends Events>(eventName: K, data: Event[K]) {
    const listeners = this.listeners[eventName];
    if (!listeners) return;
    for (const [, listener] of listeners) {
      listener?.(data);
    }
  }

  private getId(eventCode: Events): number {
    return this.freeIds[eventCode]?.shift() ?? this.listeners[eventCode]?.size ?? 0;
  }

  private reuseId(eventCode: Events, id: number): void {
    if (!this.freeIds[eventCode]) {
      this.freeIds[eventCode] = [];
    }
    this.freeIds[eventCode]?.push(id);
  }

  static getCollector(): Map<Events, number> {
    return new Map();
  }

  disposeCollector(collector: Map<Events, number>) {
    for (const [eventName, id] of collector) {
      this.off(eventName, id);
    }
  }

  emit<K extends Events>(eventName: K, data: Event[K]) {
    process.send?.({
      type: Types.Event,
      code: Events[eventName],
      data
    });
    return this;
  }

  on<K extends Events>(eventCode: K, callback: (data: Event[K]) => void, collector: Map<Events, number>) {
    if (!this.listeners[eventCode]) {
      this.listeners[eventCode] = new Map();
    }
    const id = this.getId(eventCode);
    this.listeners[eventCode]?.set(id, callback);
    if (collector) {
      collector.set(eventCode, id);
    }
    return this;
  };

  off<K extends Events>(eventCode: K, id: number): void {
    if (!this.listeners[eventCode]) return;
    this.listeners[eventCode]?.delete(id);
    this.reuseId(eventCode, id);
  }
}

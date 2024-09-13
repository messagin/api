import { Types } from "./actions";

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
  created_at: string;
};

interface ChatEvent {
  space_id: string | null;
  flags: number;
  id: string;
  name: string;
  created_at: string;
};

interface MessageEvent {
  id: string;
  user_id: string;
  chat_id: string;
  content: string;
  flags: number;
  created_at: string;
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

interface ReadyEvent {

};

export interface Events {
  Ready: [ReadyEvent];
  SessionCreate: [SessionCreateEvent];
  SessionUpdate: [SessionUpdateEvent];
  SessionDelete: [SessionDeleteEvent];
  SpaceCreate: [SpaceEvent];
  SpaceUpdate: [SpaceEvent];
  SpaceDelete: [SpaceEvent];
  ChatCreate: [ChatEvent];
  ChatUpdate: [ChatEvent];
  ChatDelete: [ChatEvent];
  MessageCreate: [MessageEvent];
  MessageUpdate: [MessageEvent];
  MessageDelete: [MessageEvent];
  RoleCreate: [RoleEvent];
  RoleUpdate: [RoleEvent];
  RoleDelete: [RoleEvent];
  MemberCreate: [MemberEvent];
  MemberUpdate: [MemberEvent];
  MemberDelete: [MemberEvent];
  InviteCreate: [InviteEvent];
  InviteUpdate: [InviteEvent];
  InviteDelete: [InviteEvent];
};

export type EventName = keyof Events;

export class Emitter {
  private static instance: Emitter | null;

  private listeners: { [K in EventName]?: Map<number, (...args: Events[K]) => void> };
  private freeIds: { [K in EventName]?: number[] };

  constructor() {
    this.listeners = {} as { [K in EventName]?: Map<number, (...args: Events[K]) => void> };
    this.freeIds = {} as { [K in EventName]?: number[] };

    process.on("message", <K extends EventName>(msg: { type: Types, name: K, data: Events[K] }) => {
      this.onMessage(msg);
    });
  }

  static getInstance(): Emitter {
    if (!Emitter.instance) {
      Emitter.instance = new Emitter();
    }
    return Emitter.instance;
  }

  private onMessage<K extends EventName>(msg: { type: Types, name: K, data: Events[K] }) {
    if (msg.type === Types.Event) {
      this.internalEmit(msg.name, msg.data);
    }
  }

  private internalEmit<K extends EventName>(eventName: K, data: Events[K]) {
    const listeners = this.listeners[eventName];
    if (!listeners) return;
    for (const [, listener] of listeners) {
      listener?.(...data);
    }
  }

  private getId(eventName: EventName): number {
    return this.freeIds[eventName]?.shift() ?? this.listeners[eventName]?.size ?? 0;
  }

  private reuseId(eventName: EventName, id: number): void {
    if (!this.freeIds[eventName]) {
      this.freeIds[eventName] = [];
    }
    this.freeIds[eventName]?.push(id);
  }

  static getCollector(): Map<EventName, number> {
    return new Map();
  }

  disposeCollector(collector: Map<EventName, number>) {
    for (const [eventName, id] of collector) {
      this.off(eventName, id);
    }
  }

  emit<K extends EventName>(eventName: K, ...data: Events[K]) {
    process.send?.({
      type: Types.Event,
      name: eventName,
      data
    });
    return this;
  }

  on<K extends EventName = EventName>(eventName: K, callback: (...data: Events[K]) => void, collector: Map<EventName, number>) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = new Map();
    }
    const id = this.getId(eventName);
    this.listeners[eventName]?.set(id, callback);
    if (collector) {
      collector.set(eventName, id);
    }
    return this;
  };

  off<K extends EventName>(eventName: K, id: number): void {
    if (!this.listeners[eventName]) return;
    this.listeners[eventName]?.delete(id);
    this.reuseId(eventName, id);
  }
}

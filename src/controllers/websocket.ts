import expressWs, { Application, Router as WsRouter } from "express-ws";
import { Router } from "express";
import { authenticateWebSocket } from "../middlewares/authenticateWs";
import { User } from "../schemas/User";
import { Emitter, Events, Event } from "../utils/events";
import { UserEvent, UserEvents } from "../utils/userevents";
import { WebSocket, RawData } from "ws";
import { log } from "../utils/log";
import { Space } from "../schemas/Space";
import { Chat } from "../schemas/Chat";
import { Session } from "../schemas/Session";
// import { log } from "../utils/log";

const events = Emitter.getInstance();
const timeout = 30000;
const network_margin = 5000;

enum OpCodes {
  Hello = 0,
  Ping = 1,
  Pong = 2,
  AuthenticateRequest = 3,
  AuthenticateResponse = 4,
  Ready = 5,
  Error = 6,
  Reconnect = 7,
  RateLimit = 8,
  ConnectionClosed = 9,

  Dispatch = 10,
  DispatchACK = 11,
  UserDispatch = 12,
};

type WsHelloEvent = { op: OpCodes.Hello; d: { interval: number } };
type WsPingEvent = { op: OpCodes.Ping };
type WsPongEvent = { op: OpCodes.Pong };
type WsAuthenticateRequestEvent = { op: OpCodes.AuthenticateRequest };
type WsAuthenticateResponseEvent = { op: OpCodes.AuthenticateResponse; d: { auth: string } };
type WsReadyEvent = { op: OpCodes.Ready }; // todo implement
type WsErrorEvent = { op: OpCodes.Error; d: { code: number; message: string } };
type WsReconnectEvent = { op: OpCodes.Reconnect; d: { delay: number } };
type WsRateLimitEvent = { op: OpCodes.RateLimit; d: unknown };
type WsConnectionClosedEvent = { op: OpCodes.ConnectionClosed; d: { code: number; reason: string } };

type WsDispatchEvent<K extends Events> = { op: OpCodes.Dispatch; t: K; d: Event[K] };
type WsDispatchACKEvent<K extends UserEvents> = { op: OpCodes.DispatchACK; t: K; d?: UserEvent[K] };
type WsUserDispatchEvent<K extends UserEvents> = { op: OpCodes.UserDispatch; t: K; d: UserEvent[K] };

type WsEvent =
  WsHelloEvent
  | WsPingEvent
  | WsPongEvent
  | WsAuthenticateRequestEvent
  | WsAuthenticateResponseEvent
  | WsReadyEvent
  | WsErrorEvent
  | WsReconnectEvent
  | WsRateLimitEvent
  | WsConnectionClosedEvent
  | WsDispatchEvent<Events>
  | WsDispatchACKEvent<UserEvents>
  | WsUserDispatchEvent<UserEvents>;

function send(ws: WebSocket, data: WsEvent) {
  try {
    ws.send(JSON.stringify(data));
  } catch (err) {
    log("red")((err as Error).message);
  }
}

function requestAuthentication(ws: WebSocket) {
  return new Promise<Session>(resolve => {
    const listener = async (data: RawData) => {
      const event = JSON.parse(data.toString()) as WsAuthenticateResponseEvent;
      if (event.op === OpCodes.AuthenticateResponse) {
        const response = await authenticateWebSocket(event.d?.auth);
        ws.off("message", listener);
        if (response.code === 0) {
          return resolve(response.session);
        }
      }
    };
    ws.on("message", listener);
    ws.send(JSON.stringify({ op: OpCodes.AuthenticateRequest } as WsAuthenticateRequestEvent));
  });
}

type WsWrapper = { client: WebSocket, lastPing: number, chats: Set<string> };

export function configure(router: Router) {
  expressWs(router as Application);

  const r = router as WsRouter;

  const clients = new Set<WsWrapper>();

  setInterval(() => {
    const now = Date.now();
    for (const ws of clients) {
      if (now - ws.lastPing < timeout + network_margin) continue;
      ws.client.terminate();
      clients.delete(ws);
    }
  }, 5000);

  r.ws("/events", async (ws, req) => {
    const self: WsWrapper = { client: ws, lastPing: Date.now(), chats: new Set() };
    clients.add(self);

    send(ws, { op: OpCodes.Hello, d: { interval: timeout } });

    ws.on("message", message => {
      const event: WsEvent = JSON.parse(message.toString());

      switch (event.op) {
        case OpCodes.Ping:
          self.lastPing = Date.now();
          send(ws, { op: OpCodes.Ping });
          break;
        case OpCodes.AuthenticateResponse: // todo reject if already authenticated
          break;
        case OpCodes.UserDispatch:
          switch (event.t) {
            case UserEvents.Subscribe:
              self.chats.add(event.d.chat_id);
              send(ws, { op: OpCodes.DispatchACK, t: UserEvents.Subscribe });
              break;
            case UserEvents.Unsubscribe:
              self.chats.delete(event.d.chat_id);
              send(ws, { op: OpCodes.DispatchACK, t: UserEvents.Unsubscribe });
              break;
          }
          break;
        case OpCodes.Pong:
        case OpCodes.AuthenticateRequest:
        case OpCodes.Ready:
        case OpCodes.Error:
        case OpCodes.Dispatch:
        case OpCodes.DispatchACK:
        case OpCodes.Reconnect:
        case OpCodes.RateLimit:
        case OpCodes.ConnectionClosed:
          // todo received server-side opcode, terminate connection
          break;
      }
    });

    const listeners = Emitter.getCollector();

    const auth_response = await authenticateWebSocket(req.headers.authorization);

    if (auth_response.code === -2) {
      ws.close(3003);
      return;
    }

    const session = auth_response.code === 0 ? auth_response.session : await requestAuthentication(ws);

    const user = await User.getById(session.user_id!);

    if (!user) {
      ws.close(1011, "Internal Server Error");
      return;
    }

    // get current user state
    const state = await getUserState(user);

    send(ws, { op: OpCodes.Dispatch, t: Events.Ready, d: state });

    events.on(Events.SessionCreate, session_ => {
      if (session_.user_id !== user.id) {
        return;
      }
      send(ws, { op: OpCodes.Dispatch, t: Events.SessionCreate, d: session_ });
    }, listeners);

    events.on(Events.SessionUpdate, session_ => {
      if (session_.user_id !== user.id) {
        return;
      }
      send(ws, { op: OpCodes.Dispatch, t: Events.SessionUpdate, d: session_ });
    }, listeners);

    events.on(Events.SessionDelete, session_ => {
      if (session_.user_id !== user.id) {
        return;
      }
      send(ws, { op: OpCodes.Dispatch, t: Events.SessionDelete, d: session_ });
      if (session_.id === session.id) {
        ws.close(1000);
      }
    }, listeners);

    events.on(Events.SpaceCreate, space => {
      if (space.owner_id !== user.id) {
        return;
      }
      send(ws, { op: OpCodes.Dispatch, t: Events.SpaceCreate, d: space });
    }, listeners);

    events.on(Events.SpaceUpdate, async space => {
      const is_member = await new Space(space.id).members.has(user.id);
      if (!is_member) {
        return;
      }
      send(ws, { op: OpCodes.Dispatch, t: Events.SpaceUpdate, d: space });
    }, listeners);

    events.on(Events.SpaceDelete, async space => {
      const is_member = await new Space(space.id).members.has(user.id);
      if (!is_member) {
        return;
      }
      send(ws, { op: OpCodes.Dispatch, t: Events.SpaceDelete, d: space });
    }, listeners);

    // todo perform permission checks on chats
    events.on(Events.ChatCreate, async chat => {
      const is_member = await new Space(chat.space_id!).members.has(user.id);
      if (!is_member) {
        return;
      }
      send(ws, { op: OpCodes.Dispatch, t: Events.ChatCreate, d: chat });
    }, listeners);

    events.on(Events.ChatUpdate, async chat => {
      const is_member = await new Space(chat.space_id!).members.has(user.id);
      if (!is_member) {
        return;
      }
      send(ws, { op: OpCodes.Dispatch, t: Events.ChatUpdate, d: chat });
    }, listeners);

    events.on(Events.ChatDelete, async chat => {
      const is_member = await new Space(chat.space_id!).members.has(user.id);
      if (!is_member) {
        return;
      }
      send(ws, { op: OpCodes.Dispatch, t: Events.ChatDelete, d: chat });
    }, listeners);

    // todo perform checks on messages
    events.on(Events.MessageCreate, async message => {
      console.log(self.chats, message);
      if (!self.chats.has(message.chat_id)) {
        return; // user is not subscribed to chat
      }
      const chat = await Chat.getById(message.chat_id);
      if (!chat) {
        return;
      }
      const is_member = await new Space(chat.space_id!).members.has(user.id);
      if (!is_member) {
        return;
      }
      send(ws, { op: OpCodes.Dispatch, t: Events.MessageCreate, d: message });
    }, listeners);

    events.on(Events.MessageUpdate, async message => {
      if (!self.chats.has(message.chat_id)) {
        return; // user is not subscribed to chat
      }
      const chat = await Chat.getById(message.chat_id);
      if (!chat) {
        return;
      }
      const is_member = await new Space(chat.space_id!).members.has(user.id);
      if (!is_member) {
        return;
      }
      send(ws, { op: OpCodes.Dispatch, t: Events.MessageUpdate, d: message });
    }, listeners);

    events.on(Events.MessageDelete, async message => {
      if (!self.chats.has(message.chat_id)) {
        return; // user is not subscribed to chat
      }
      const chat = await Chat.getById(message.chat_id);
      if (!chat) {
        return;
      }
      const is_member = await new Space(chat.space_id!).members.has(user.id);
      if (!is_member) {
        return;
      }
      send(ws, { op: OpCodes.Dispatch, t: Events.MessageDelete, d: message });
    }, listeners);

    events.on(Events.RoleCreate, async role => {
      const is_member = await new Space(role.space_id).members.has(user.id);
      if (!is_member) {
        return;
      }
      send(ws, { op: OpCodes.Dispatch, t: Events.RoleCreate, d: role });
    }, listeners);

    events.on(Events.RoleUpdate, async role => {
      const is_member = await new Space(role.space_id).members.has(user.id);
      if (!is_member) {
        return;
      }
      send(ws, { op: OpCodes.Dispatch, t: Events.RoleUpdate, d: role });
    }, listeners);

    events.on(Events.RoleDelete, async role => {
      const is_member = await new Space(role.space_id).members.has(user.id);
      if (!is_member) {
        return;
      }
      send(ws, { op: OpCodes.Dispatch, t: Events.RoleDelete, d: role });
    }, listeners);

    events.on(Events.MemberCreate, async member => {
      const is_self = member.user_id === user.id;
      const is_member = await new Space(member.space_id).members.has(user.id);
      if (!(is_self || is_member)) {
        return;
      }
      send(ws, { op: OpCodes.Dispatch, t: Events.MemberCreate, d: member });
    }, listeners);

    events.on(Events.MemberDelete, async member => {
      const is_self = member.user_id === user.id;
      const is_member = await new Space(member.space_id).members.has(user.id);
      if (!(is_self || is_member)) {
        return;
      }
      send(ws, { op: OpCodes.Dispatch, t: Events.MemberDelete, d: member });
    }, listeners);

    events.on(Events.MemberUpdate, async member => {
      const is_self = member.user_id === user.id;
      const is_member = await new Space(member.space_id).members.has(user.id);
      if (!(is_self || is_member)) {
        return;
      }
      send(ws, { op: OpCodes.Dispatch, t: Events.MemberUpdate, d: member });
    }, listeners);

    ws.on("close", (_code, reason) => {
      log("white")(reason.toString());
      ws.removeAllListeners();
      events.disposeCollector(listeners);
    });
  });
}

async function getUserState(user: User) {
  const sessions = await user.sessions.list();
  const spaces = await user.spaces.list();

  return {
    spaces,
    user: user.clean(),
    sessions: sessions.map((session) => session.clean()),
  };
}

import expressWs, { Application, Router as WsRouter } from "express-ws";
import { Router } from "express";
import { authenticateWebSocket } from "../middlewares/authenticateWs";
// import db from "../utils/database";
// import { Session } from "../models/Session";
import { User } from "../schemas/User";
import { Emitter, EventName, Events } from "../utils/events";
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
  Dispatch,
  LifeCycle,
  Authenticate,
  Hello = 10,
  PingRecv = 11,
}

type WsDispatchEvent<K extends EventName> = { op: OpCodes.Dispatch; t: K; d: Events[K] };
type WsLifeCycleEvent = { op: OpCodes.LifeCycle; };
type WsAuthEvent = { op: OpCodes.Authenticate; d?: { auth: string } };
type WsHelloEvent = { op: OpCodes.Hello, d: { interval: number } };
type WsPingRecvEvent = { op: OpCodes.PingRecv };

type WsWrapper = { client: WebSocket, lastPing: number };

function dispatch(ws: WebSocket, data: Partial<WsDispatchEvent<EventName>>) {
  try {
    ws.send(JSON.stringify({ op: OpCodes.Dispatch, ...data }));
  } catch (err) {
    log("red")((err as Error).message);
  }
}

async function initLifeCycle(ws: WsWrapper) {
  // todo manage PING / PONG
  // ! disconnect client on timeout

  ws.client.send(
    JSON.stringify({
      op: OpCodes.Hello,
      d: {
        interval: timeout
      }
    } as WsHelloEvent)
  );

  ws.client.on("close", () => { })

  ws.client.on("message", (message) => {
    const event: WsLifeCycleEvent = JSON.parse(message.toString());
    if (event.op !== OpCodes.LifeCycle) return;

    ws.lastPing = Date.now();
    ws.client.send(
      JSON.stringify({
        op: OpCodes.PingRecv
      } as WsPingRecvEvent)
    )
    // we received a ping
    // reply with pong and update tracking
  });
}

function requestAuthentication(ws: WebSocket) {
  return new Promise<Session>(resolve => {
    const listener = async (data: RawData) => {
      const event = JSON.parse(data.toString()) as WsAuthEvent;
      if (event.op === OpCodes.Authenticate) {
        const response = await authenticateWebSocket(event.d?.auth);
        ws.off("message", listener);
        if (response.code === 0) {
          return resolve(response.session);
        }
      }
    };
    ws.on("message", listener);
    ws.send(JSON.stringify({ op: OpCodes.Authenticate } as WsAuthEvent));
  });
}

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
    const self: WsWrapper = { client: ws, lastPing: Date.now() };
    clients.add(self);

    initLifeCycle(self);

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

    dispatch(ws, { t: "Ready", d: state });

    events.on("SessionCreate", session_ => {
      if (session_.user_id !== user.id) {
        return;
      }
      dispatch(ws, { t: "SessionCreate", d: session_ });
    }, listeners);

    events.on("SessionUpdate", session_ => {
      if (session_.user_id !== user.id) {
        return;
      }
      dispatch(ws, { t: "SessionUpdate", d: session_ });
    }, listeners);

    events.on("SessionDelete", session_ => {
      if (session_.user_id !== user.id) {
        return;
      }
      dispatch(ws, { t: "SessionDelete", d: session_ });
      if (session_.id === session.id) {
        ws.close(1000);
      }
    }, listeners);

    events.on("SpaceCreate", space => {
      if (space.owner_id !== user.id) {
        return;
      }
      dispatch(ws, { t: "SpaceCreate", d: space });
    }, listeners);

    events.on("SpaceUpdate", async space => {
      const is_member = await new Space(space.id).members.has(user.id);
      if (!is_member) {
        return;
      }
      dispatch(ws, { t: "SpaceUpdate", d: space });
    }, listeners);

    events.on("SpaceDelete", async space => {
      const is_member = await new Space(space.id).members.has(user.id);
      if (!is_member) {
        return;
      }
      dispatch(ws, { t: "SpaceDelete", d: space });
    }, listeners);

    // todo perform permission checks on chats
    events.on("ChatCreate", async chat => {
      const is_member = await new Space(chat.space_id!).members.has(user.id);
      if (!is_member) {
        return;
      }
      dispatch(ws, { t: "ChatCreate", d: chat });
    }, listeners);

    events.on("ChatUpdate", async chat => {
      const is_member = await new Space(chat.space_id!).members.has(user.id);
      if (!is_member) {
        return;
      }
      dispatch(ws, { t: "ChatUpdate", d: chat });
    }, listeners);

    events.on("ChatDelete", async chat => {
      const is_member = await new Space(chat.space_id!).members.has(user.id);
      if (!is_member) {
        return;
      }
      dispatch(ws, { t: "ChatDelete", d: chat });
    }, listeners);

    // todo perform checks on messages
    events.on("MessageCreate", async message => {
      const chat = await Chat.getById(message.chat_id);
      if (!chat) {
        return;
      }
      const is_member = await new Space(chat.space_id!).members.has(user.id);
      if (!is_member) {
        return;
      }
      dispatch(ws, { t: "MessageCreate", d: message });
    }, listeners);

    events.on("MessageUpdate", async message => {
      const chat = await Chat.getById(message.chat_id);
      if (!chat) {
        return;
      }
      const is_member = await new Space(chat.space_id!).members.has(user.id);
      if (!is_member) {
        return;
      }
      dispatch(ws, { t: "MessageUpdate", d: message });
    }, listeners);

    events.on("MessageDelete", async message => {
      const chat = await Chat.getById(message.chat_id);
      if (!chat) {
        return;
      }
      const is_member = await new Space(chat.space_id!).members.has(user.id);
      if (!is_member) {
        return;
      }
      dispatch(ws, { t: "MessageDelete", d: message });
    }, listeners);

    events.on("RoleCreate", async role => {
      const is_member = await new Space(role.space_id).members.has(user.id);
      if (!is_member) {
        return;
      }
      dispatch(ws, { t: "RoleCreate", d: role });
    }, listeners);

    events.on("RoleUpdate", async role => {
      const is_member = await new Space(role.space_id).members.has(user.id);
      if (!is_member) {
        return;
      }
      dispatch(ws, { t: "RoleUpdate", d: role });
    }, listeners);

    events.on("RoleDelete", async role => {
      const is_member = await new Space(role.space_id).members.has(user.id);
      if (!is_member) {
        return;
      }
      dispatch(ws, { t: "RoleDelete", d: role });
    }, listeners);

    events.on("MemberCreate", async member => {
      const is_self = member.user_id === user.id;
      const is_member = await new Space(member.space_id).members.has(user.id);
      if (!(is_self || is_member)) {
        return;
      }
      dispatch(ws, { t: "MemberCreate", d: member });
    }, listeners);

    events.on("MemberDelete", async member => {
      const is_self = member.user_id === user.id;
      const is_member = await new Space(member.space_id).members.has(user.id);
      if (!(is_self || is_member)) {
        return;
      }
      dispatch(ws, { t: "MemberDelete", d: member });
    }, listeners);

    events.on("MemberUpdate", async member => {
      const is_self = member.user_id === user.id;
      const is_member = await new Space(member.space_id).members.has(user.id);
      if (!(is_self || is_member)) {
        return;
      }
      dispatch(ws, { t: "MemberUpdate", d: member });
    }, listeners);

    ws.on("close", (_code, reason) => {
      log("white")(reason.toString());
      ws.removeAllListeners();
      events.disposeCollector(listeners);
    });
  });
}

// const chatCreate = ({ user, ws }) => async chat => {
//   const member = await db("members")
//     .select("permissions", "color")
//     .where({ chat_id: chat.id, user_id: user.id })
//     .first()
//     .catch(log("red", "WS /api/v1/events/chatCreate"));

//   if (!member) {
//     return;
//   }
//   ws.send(JSON.stringify({ name: "chatCreate", data: chat }));
// };

async function getUserState(user: User) {
  const sessions = await user.sessions.list();
  const spaces = await user.spaces.list();

  return {
    spaces,
    user: user.clean(),
    sessions: sessions.map((session) => session.clean()),
  };
}

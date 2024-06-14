import expressWs, { Application, Router } from "express-ws";
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

enum OpCodes {
  Dispatch,
  LifeCycle,
  Authenticate,
}

type WsDispatchEvent<K extends EventName> = { op: OpCodes.Dispatch; t: K; d: Events[K][0] };
type WsLifeCycleEvent = { op: OpCodes.LifeCycle; d?: { interval: number } };
type WsAuthEvent = { op: OpCodes.Authenticate; d?: { auth: string } };

function dispatch(ws: WebSocket, data: Partial<WsDispatchEvent<EventName>>) {
  try {
    ws.send(JSON.stringify({ op: OpCodes.Dispatch, ...data }));
  } catch (err) {
    log("red")((err as Error).message);
  }
}

async function initLifeCycle(ws: WebSocket) {
  // todo manage PING / PONG
  // ! disconnect client on timeout

  ws.send(
    JSON.stringify({
      op: OpCodes.LifeCycle,
      d: {
        interval: 30000,
      },
    } as WsLifeCycleEvent),
  );


  ws.on("close", () => { })

  ws.on("message", (message) => {
    const event: WsLifeCycleEvent = JSON.parse(message.toString());
    if (event.op !== OpCodes.LifeCycle) return;

    // we received a ping
    // reply with pong and update tracking
  });
}

function requestAuthentication(ws: WebSocket) {
  return new Promise<Session>((resolve) => {
    const listener = async (data: RawData) => {
      const event = JSON.parse(data.toString()) as WsAuthEvent;
      if (event.op === OpCodes.Authenticate) {
        const session = await authenticateWebSocket(event.d?.auth);
        if (session) {
          ws.off("message", listener);
          return resolve(session);
        }
      }
    };
    ws.on("message", listener);
    ws.send(JSON.stringify({ op: OpCodes.Authenticate } as WsAuthEvent));
  });
}

export function configure(router: Router) {
  expressWs(router as Application);

  router.ws("/events", async (ws, req) => {
    initLifeCycle(ws);

    const listeners = Emitter.getCollector();

    let s = await authenticateWebSocket(req.headers.authorization);
    // todo check if user tried to authenticate, in which case we should close the connection

    if (!s) {
      s = await requestAuthentication(ws);
    }

    const session = s;

    const user = await User.getById(session.user_id);

    if (!user) {
      ws.close(1011, "Internal Server Error");
      return;
    }

    // get current user state
    const state = await getUserState(user);

    dispatch(ws, { t: "Ready", d: state });

    events.on("SessionCreate", session_ => {
      if (session_.id !== user.id) {
        return;
      }
      dispatch(ws, { t: "SessionCreate", d: session_ });
    }, listeners);

    events.on("SessionUpdate", session_ => {
      if (session_.id !== user.id) {
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
        ws.close();
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
      const is_member = await new Space(chat.space_id).members.has(user.id);
      if (!is_member) {
        return;
      }
      dispatch(ws, { t: "ChatCreate", d: chat });
    }, listeners);

    events.on("ChatUpdate", async chat => {
      const is_member = await new Space(chat.space_id).members.has(user.id);
      if (!is_member) {
        return;
      }
      dispatch(ws, { t: "ChatUpdate", d: chat });
    }, listeners);

    events.on("ChatDelete", async chat => {
      const is_member = await new Space(chat.space_id).members.has(user.id);
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
      const is_member = await new Space(chat.space_id).members.has(user.id);
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
      const is_member = await new Space(chat.space_id).members.has(user.id);
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
      const is_member = await new Space(chat.space_id).members.has(user.id);
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

    ws.on("close", () => {
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

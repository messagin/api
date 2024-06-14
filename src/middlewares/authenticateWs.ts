import { generateHash } from "../utils/auth.node";
import { Session } from "../schemas/Session";
import { log } from "../utils/log";

export async function authenticateWebSocket(authorization?: string): Promise<Session | null> {
  if (typeof authorization !== "string") {
    return null;
  }
  const [type, xtoken] = authorization.split(" ");
  if (!xtoken) {
    return null;
  }
  if (type !== "User" && type !== "Bot") {
    return null;
  }

  if (xtoken.length !== 96) {
    return null;
  }

  const id = Buffer.from(xtoken.slice(0, 22), "base64url").toString("utf8");
  const token = generateHash(xtoken);

  if (!/^[0-9A-HJKMNP-TV-Z]{16}$/.test(id)) {
    return null;
  }

  let session;
  try {
    session = await Session.getById(id);
  }
  catch (err) {
    log("red")((err as Error).message);
    return null;
  }

  if (!session || session.token.hash !== token) {
    return null;
  }

  if ((session.hasFlag("Bot") && type === "Bot") || (!session.hasFlag("Bot") && type === "User")) {
    return session;
  }

  return null;
}

import { generateHash } from "../utils/auth.node";
import { Session } from "../schemas/Session";
import { log } from "../utils/log";

type AuthenticationResponse = {
  code: number;
  session?: Session;
};

export async function authenticateWebSocket(authorization?: string): Promise<AuthenticationResponse> {
  if (typeof authorization !== "string") {
    return { code: -1 };
  }
  const [type, xtoken] = authorization.split(" ");
  if (!xtoken) {
    return { code: -1 };
  }
  if (type !== "User" && type !== "Bot") {
    return { code: -1 };
  }

  if (xtoken.length !== 96) {
    return { code: -2 };
  }

  const id = Buffer.from(xtoken.slice(0, 22), "base64url").toString("utf8");
  const token = generateHash(xtoken);

  if (!/^[0-9A-HJKMNP-TV-Z]{16}$/.test(id)) {
    throw new Error("invalid token");
  }

  let session;
  try {
    session = await Session.getById(id);
  }
  catch (err) {
    log("red")((err as Error).message);
    return { code: -2 };
  }

  if (!session || session.token.hash !== token) {
    return { code: -2 };
  }

  if ((session.hasFlag("Bot") && type === "Bot") || (!session.hasFlag("Bot") && type === "User")) {
    return { code: 0, session };
  }

  return { code: -2 };
}

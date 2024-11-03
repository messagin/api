import * as userController from "../controllers/user";
import * as chatController from "../controllers/chat";
import * as roleController from "../controllers/role";
import * as spaceController from "../controllers/space";
import * as memberController from "../controllers/member";
import * as inviteController from "../controllers/invite";
import * as messageController from "../controllers/message";
import * as relationController from "../controllers/relation";
import * as userChatController from "../controllers/userchat";
import * as websocketController from "../controllers/websocket";

import * as userValidator from "../validators/user";
import * as chatValidator from "../validators/chat";
import * as roleValidator from "../validators/role";
import * as spaceValidator from "../validators/space";
import * as memberValidator from "../validators/member";
import * as inviteValidator from "../validators/invite";
import * as messageValidator from "../validators/message";
import * as relationValidator from "../validators/relation";

import { Router } from "express";
import { respond } from "../utils/respond";
import { authenticate } from "../middlewares/authenticate";
import { rateLimitByIp } from "../utils/ratelimit";
import { User } from "../schemas/User";
import db from "../utils/database";

const router = Router();
export default router;

router.options("*", (_req, res) => {
  respond(res, 204, "NoContent");
});

router.use(rateLimitByIp);

router.use("/purge", authenticate);
router.use("/chats", authenticate);
router.use("/spaces", authenticate);
router.use("/invites", authenticate);
router.use("/users/self", authenticate);

// events
websocketController.configure(router);


//! created_at is now deprecated. Exception: ratelimits

// todo implement reactions

// router.get("/id"); //? request a server-generated ID
//? the ID will be cached, and detected by the server.
//? ensure the ID is protected from abuse by external atteckers

//#region users
router.get("/users/self", userController.getSelf);
router.put("/users/self/password", userValidator.updatePassword, userController.updatePassword);
router.post("/users/self/mfa/validate", userController.validateMfa);
router.delete("/users/self", userController.destroy);

router.post("/users/try", userValidator.createTrial, userController.createTrial);
router.post("/users/signup", userValidator.create, userController.create);
router.post("/users/authenticate", userValidator.login, userController.login);
router.get("/users/:user_id", authenticate, userValidator.getById, userController.getById);
// router.get("/users/:user_id/profile", authenticate, userValidator.getProfile, userController.getProfile); // todo implement getProfile
//#endregion

//#region spaces
router.get("/spaces", spaceController.get); // list user spaces
router.post("/spaces", spaceValidator.create, spaceController.create); // create new space
router.get("/spaces/:space_id", spaceValidator.getById, spaceController.getById); // get space
router.delete("/spaces/:space_id", spaceValidator.destroy, spaceController.destroy); // delete space
//#endregion

//#region invites
router.get("/spaces/:space_id/invites", inviteValidator.get, inviteController.get); // get invites
router.post("/invites/:invite_id", inviteValidator.accept, inviteController.accept); // accept invite
router.get("/invites/:invite_id", inviteValidator.getById, inviteController.getById); // get invite
router.post("/spaces/:space_id/invites", inviteValidator.create, inviteController.create); // create invite
router.delete("/invites/:invite_id", inviteValidator.destroy, inviteController.destroy); // delete invite
//#endregion

//#region members
router.put("/spaces/:space_id/members/:member_id", memberValidator.add, memberController.add); //? forcefully add a new member to the space (bots-only)
router.get("/spaces/:space_id/members", memberValidator.get, memberController.get); // list members
router.get("/spaces/:space_id/members/:member_id", memberValidator.getById, memberController.getById); // get member
//#endregion

//#region roles
router.post("/spaces/:space_id/roles", roleValidator.create, roleController.create);
router.delete("/spaces/:space_id/roles/:role_id", roleValidator.destroy, roleController.destroy);
//#endregion

//#region chats
router.get("/chats", userChatController.get);
router.post("/chats", userChatController.create);
router.get("/chats/:chat_id", chatValidator.getById, chatController.getById); // get chat
router.patch("/chats/:chat_id", chatValidator.update, chatController.update); // update chat
router.delete("/chats/:chat_id", chatValidator.destroy, chatController.destroy); // delete chat
router.get("/spaces/:space_id/chats", chatValidator.get, chatController.get); // list chats
router.post("/spaces/:space_id/chats", chatValidator.create, chatController.create); // create chat
//#endregion

//#region messages
router.get("/chats/:chat_id/messages", messageValidator.get, messageController.get); // list messages
router.post("/chats/:chat_id/messages", messageValidator.create, messageController.create); // create message
router.get("/chats/:chat_id/messages/search", messageValidator.search, messageController.search); // search for messages
router.get("/chats/:chat_id/messages/:message_id", messageValidator.getById, messageController.getById); // get message
router.patch("/chats/:chat_id/messages/:message_id", messageValidator.update, messageController.update); // update message
router.delete("/chats/:chat_id/messages/:message_id", messageValidator.destroy, messageController.destroy); // delete message
//#endregion

//#region friends
router.get("/users/self/relations", relationController.get); // list relations
router.put("/users/self/relations/:user_id", relationValidator.create, relationController.create); // add friend
router.get("/users/self/relations/:user_id", relationValidator.getById, relationController.getById); // get friend
router.delete("/users/self/relations/:user_id", relationValidator.destroy, relationController.destroy); // remove friend
//#endregion

router.delete("/purge", async (_req, res) => {
  const user = res.locals.user as User;
  if (!user.hasFlag("Admin")) {
    respond(res, 403, "Forbidden");
    return;
  }
  console.log("PURGING DATABASE ON ADMIN REQUEST...");
  // delete everything from the databases
  const chats = await db.execute("SELECT * FROM chats");
  const users = await db.execute("SELECT * FROM users");
  const roles = await db.execute("SELECT * FROM roles");
  const spaces = await db.execute("SELECT * FROM spaces");
  const members = await db.execute("SELECT * FROM members");
  const signups = await db.execute("SELECT * FROM signups");
  const invites = await db.execute("SELECT * FROM invites");
  const sessions = await db.execute("SELECT * FROM sessions");
  const messages = await db.execute("SELECT * FROM messages");
  const relations = await db.execute("SELECT * FROM relations");
  const space_chats = await db.execute("SELECT * FROM space_chats");
  const chat_members = await db.execute("SELECT * FROM chat_members");
  const member_roles = await db.execute("SELECT * FROM member_roles");
  const ip_rate_limits = await db.execute("SELECT * FROM ip_rate_limits");
  const id_rate_limits = await db.execute("SELECT * FROM id_rate_limits");
  const password_resets = await db.execute("SELECT * FROM password_resets");
  const email_validations = await db.execute("SELECT * FROM email_validations");

  for (const chat of chats) await db.execute("DELETE FROM chats WHERE id = ?", [chat.id], { prepare: true });
  for (const role of roles) await db.execute("DELETE FROM roles WHERE id = ?", [role.id], { prepare: true });
  for (const space of spaces) await db.execute("DELETE FROM spaces WHERE id = ?", [space.id], { prepare: true });
  for (const member of members) await db.execute("DELETE FROM members WHERE user_id = ? AND space_id = ?", [member.user_id, member.space_id], { prepare: true });
  for (const signup of signups) await db.execute("DELETE FROM signups WHERE id = ?", [signup.id], { prepare: true });
  for (const invite of invites) await db.execute("DELETE FROM invites WHERE id = ?", [invite.id], { prepare: true });
  for (const session of sessions) await db.execute("DELETE FROM sessions WHERE id = ?", [session.id], { prepare: true });
  for (const message of messages) await db.execute("DELETE FROM messages WHERE id = ?", [message.id], { prepare: true });
  for (const relation of relations) await db.execute("DELETE FROM relations WHERE user_id0 = ? AND user_id1 = ?", [relation.user_id0, relation.user_id1], { prepare: true });
  for (const space_chat of space_chats) await db.execute("DELETE FROM space_chats WHERE id = ?", [space_chat.id], { prepare: true });
  for (const chat_member of chat_members) await db.execute("DELETE FROM chat_members WHERE chat_id = ?", [chat_member.chat_id], { prepare: true });
  for (const member_role of member_roles) await db.execute("DELETE FROM member_roles WHERE space_id = ?", [member_role.space_id], { prepare: true });
  for (const ip_rate_limit of ip_rate_limits) await db.execute("DELETE FROM ip_rate_limits WHERE ip = ?", [ip_rate_limit.ip], { prepare: true });
  for (const id_rate_limit of id_rate_limits) await db.execute("DELETE FROM id_rate_limits WHERE id = ?", [id_rate_limit.ip], { prepare: true });
  for (const password_reset of password_resets) await db.execute("DELETE FROM password_resets WHERE id = ?", [password_reset.id], { prepare: true });
  for (const email_validation of email_validations) await db.execute("DELETE FROM email_validations WHERE id = ?", [email_validation.id], { prepare: true });

  // execute user deletion last in case something goes wrong
  for (const user of users) await db.execute("DELETE FROM users WHERE id = ?", [user.id], { prepare: true });

  respond(res, 204, "Deleted");
  return;
});

router.get("/", (_req, res) => {
  return respond(res, 200, "Ok");
})

router.all("*", (_req, res) => {
  return respond(res, 404, "NotFound");
});

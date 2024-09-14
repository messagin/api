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

const router = Router();
export default router;

router.use(rateLimitByIp);

router.use("/chats", authenticate);
router.use("/spaces", authenticate);
router.use("/invites", authenticate);
router.use("/users/self", authenticate);

// events
websocketController.configure(router);

router.options("*", (_req, res) => {
  respond(res, 200, "Ok");
});

//! created_at is now deprecated. Exception: ratelimits

// TODO REVIEW EVERY SINGLE METHOD.
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

router.all("*", (_req, res) => {
  return respond(res, 404, "NotFound");
});

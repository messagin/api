import * as userController from "../controllers/user";
import * as chatController from "../controllers/chat";
import * as spaceController from "../controllers/space";
import * as friendController from "../controllers/friend";
import * as messageController from "../controllers/message";
import * as websocketController from "../controllers/websocket";

import * as userValidator from "../validators/user";
import * as chatValidator from "../validators/chat";
import * as spaceValidator from "../validators/space";

import { authenticate } from "../middlewares/authenticate";
import { rateLimitByIp } from "../utils/ratelimit";
import { Router } from "express";
import { respond } from "../utils/respond";

// todo the following:
// ! implement websocketController
// ! implement messageController
// ! implement friendController (create a new database)
// * finish all commented endpoints
// ! add validation where necessary
// ! add models

const router = Router();
export default router;

router.use(rateLimitByIp);

router.use("/spaces", authenticate);
router.use("/chats", authenticate);
router.use("/users/me", authenticate);

// events
websocketController.configure(router);

router.options("*", (_req, res) => {
  respond(res, 200, "Ok");
});

// TODO REVIEW EVERY SINGLE METHOD.

//#region users
router.get("/users/me", userController.getCurrent);
router.put("/users/me/password", userController.updatePassword); // todo finish updatePassword
router.post("/users/me/mfa/validate", userController.validateMfa); // todo finish implementing MFA
router.delete("/users/me", userController.destroy);

router.post("/users/try", userValidator.createTrial, userController.createTrial);
router.post("/users/signup", userValidator.create, userController.create);
router.post("/users/authenticate", userValidator.login, userController.login);
router.get("/users/:user_id", authenticate, userValidator.getById, userController.getById);
//#endregion

//#region spaces
router.get("/spaces", spaceController.get);
router.get("/spaces/:space_id", spaceValidator.getById, spaceController.getById);
router.post("/spaces", spaceValidator.create, spaceController.create);
router.delete("/spaces/:space_id", spaceValidator.destroy, spaceController.destroy);
//#endregion

//#region chats
router.get("/spaces/:space_id/chats", chatValidator.get, chatController.get);
router.get("/spaces/:space_id/chats/:chat_id", chatValidator.getById, chatController.getById);
router.post("/spaces/:space_id/chats", chatValidator.create, chatController.create);
// router.patch("/spaces/:space_id/chats/:chat_id", chatController.update);
// router.delete("/spaces/:space_id/chats/:chat_id", chatController.destroy);
//#endregion

//#region messages
router.get("/chats/:chat_id/messages", messageController.get);
// router.get("/chats/:chat_id/messages/search", messageController.search)
// router.get("/chats/:chat_id/messages/:message_id", messageController.getById);
router.post("/chats/:chat_id/messages", messageController.create);
// router.patch("/chats/:chat_id/messages/:message_id", messageController.update);
// router.delete("/chats/:chat_id/messages/:message_id", messageController.destroy);
//#endregion

//#region friends
router.get("/users/me/friends", friendController.get);
// router.get("/users/me/friends/:friend_id", friendController.getById);
// router.post("/users/me/friends", friendController.add);
// router.delete("/users/me/friends/:friend_id", friendController.remove);
//#endregion

router.all("*", (_req, res) => {
  return respond(res, 404, "NotFound");
});

const userController = require("../controllers/user");
const chatController = require("../controllers/chat");
const userValidator = require("../validators/user");
const { authenticate } = require("../middlewares/authenticate");
const router = require("express").Router();
const { rateLimitByIp } = require("../utils/ratelimit");

router.use(rateLimitByIp);
router.use("/chats", authenticate);

//#region users
router.get("/users/me", authenticate, userController.getCurrent);
// fixme
router.get("/users/:user_id", authenticate, userValidator.getById, userController.getById);
router.post("/users/try", userValidator.createTrial, userController.createTrial);
router.post("/users/signup", userValidator.create, userController.create);
router.post("/users/login", userController.login);
router.delete("/users/me", authenticate, userController.destroy);

router.post("/users/me/mfa/validate", authenticate, userController.validateMfa);
router.put("/users/me/password", authenticate, userController.updatePassword);
//#endregion

//#region chats
// todo
// router.get("/chats/:chat_id", chatController.getById);
// router.get("/chats/:chat_id/messages", chatController.getMessages);
// router.get("/chats/:chat_id/messages/:message_id", chatController.getMessage);
router.post("/chats", chatController.create);
// router.post("/chats/:chat_id/messages", chatController.createMessage);
// router.patch("/chats/:chat_id", chatController.update);
// router.patch("/chats/:chat_id/messages/:message_id", chatController.updateMessage);
// router.delete("/chats/:chat_id", chatController.destroy);
// router.delete("/chats/:chat_id/messages/:message_id", chatController.destroyMessage);

//#endregion

module.exports = router;

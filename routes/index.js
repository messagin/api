const userController = require("../controllers/userController");
const { authenticate } = require("../middlewares/authenticate");
const { User } = require("../models/user");
const { validateID } = require("../utils/validate");
const router = require("express").Router();
const { ratelimit } = require("../utils/ratelimit");

//#region users
router.get("/users/me", ratelimit, authenticate, userController.getCurrent);
router.get("/users/:id", ratelimit, authenticate, validateID, userController.getById);

router.post("/users", ratelimit, userController.create)
router.post("/users/me/mfa/validate", ratelimit, authenticate, userController.validateMfa);
//#endregion

module.exports = router;

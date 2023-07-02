const userController = require("../controllers/userController");
const { authenticate } = require("../middlewares/authenticate");
const { User } = require("../models/user");
const { validateID } = require("../utils/validate");
const router = require("express").Router();

//#region users
router.get("/users/me", authenticate, userController.getCurrent);
router.get("/users/:id", authenticate, validateID, userController.getById);

router.post("/users", userController.create)
router.post("/users/me/mfa/validate", authenticate, userController.validateMfa);
//#endregion

module.exports = router;

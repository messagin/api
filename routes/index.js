const userController = require("../controllers/userController");
const { authenticate } = require("../middlewares/authenticate");
const { User } = require("../models/user");
const { validateID } = require("../utils/validate");
const router = require("express").Router();

router.post("/users/me/mfa/validate", authenticate);
router.get("/users/me", authenticate, userController.getCurrentUser);
router.get("/users/:id", authenticate, validateID);

module.exports = router;

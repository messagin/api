const { authenticate } = require("../../middlewares/authenticate");
const router = require("express").Router();

router.use("/users/", authenticate);

module.exports = router;

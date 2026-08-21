const express = require("express");
const userController = require("../controller/userController")
const router = express.Router();
const AuthCheck = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/allowRoles");
const authorizeRoles = require("../middleware/roleMiddleware")

router.get("/user/food_list", AuthCheck, authorizeRoles("user"), userController.userfoodlist)
router.get(
    "/user/restaurant-list",
    authorizeRoles("user"),
    userController.userRestaurantList
);

module.exports = router;

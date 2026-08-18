const express = require("express");

const router = express.Router();
const adminController = require("../controller/adminController");
const upload = require("../middleware/image");
const AuthCheck = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

router.put(
  "/admin/update-restaurant/:id",
  adminController.updateRestaurantStatus,
);

router.get(
  "/admin/restaurants/approved",
  adminController.approvedRestaurants
);
router.get(
  "/admin/restaurants/pending",
  adminController.pendingRestaurants
);

router.delete("/restaurant/delete/:id", adminController.deleteRestaurant);

router.patch("/food/:foodId/status", AuthCheck, authorizeRoles("admin"), adminController.approveFood);

router.get("/pending/foodlist", AuthCheck, authorizeRoles("admin"), adminController.pendingFoodList)

module.exports = router;

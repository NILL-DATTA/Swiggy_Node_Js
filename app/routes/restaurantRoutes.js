const express = require("express");

const router = express.Router();

const AuthCheck = require("../middleware/authMiddleware");
const upload = require("../middleware/image");
const restaurantController = require("../controller/restaurantController.js");
const allowRoles = require("../middleware/allowRoles");

router.post(
  "/auth/apply/restaurant",
  AuthCheck,
  restaurantController.applyRestaurant,
);

router.post("/restaurant/otp", restaurantController.verifyRestaurantOtp);
router.post(
  "/restaurant/details",
  AuthCheck,

  restaurantController.restaurantDetails,
);

router.post(
  "/restaurant/documents",
  AuthCheck,

  restaurantController.restaurantDoc,
);

router.post(
  "/partner-contract",
  AuthCheck,
  restaurantController.acceptPartnerContract
);

router.post(
  "/add-food",
  upload.single("image"),
  restaurantController.addFood
);

router.delete("/food/:id", restaurantController.deleteFood);

router.get("/food/list", restaurantController.getAllFoods);

router.get("/food/details/:id", restaurantController.getFoodById);

module.exports = router;

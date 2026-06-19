const express = require("express");

const router = express.Router();

const AuthCheck = require("../middleware/authMiddleware");
const upload = require("../middleware/image");
const restaurantController = require("../controller/restaurantController");
const allowRoles = require("../middleware/allowRoles");

router.post("/add/food", AuthCheck, restaurantController.addFood);
router.get("/list/food", AuthCheck, restaurantController.listFood);

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
  "/restaurants/menu",
  AuthCheck,
  upload.single("image"),
  restaurantController.restaurantMenu,
);

router.post(
  "/partner-contract",
  AuthCheck,
  restaurantController.acceptPartnerContract
);
module.exports = router;

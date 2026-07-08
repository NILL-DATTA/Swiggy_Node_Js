const express = require("express");

const router = express.Router();

const AuthCheck = require("../middleware/authMiddleware");
const upload = require("../middleware/image");
const restaurantController = require("../controller/restaurantController.js");
const allowRoles = require("../middleware/allowRoles");
const { restaurantOwner } = require("../middleware/restaurantMiddleware.js")
router.post(
  "/auth/apply/restaurant",
  AuthCheck,
  restaurantController.applyRestaurant,
);

router.post("/restaurant/otp", AuthCheck, restaurantOwner, restaurantController.verifyRestaurantOtp);
router.post(
  "/restaurant/details",
  AuthCheck,
  restaurantOwner,
  restaurantController.restaurantDetails,
);

router.post(
  "/restaurant/documents",
  AuthCheck,
  restaurantOwner,
  restaurantController.restaurantDoc,
);

router.post(
  "/partner-contract",
  AuthCheck,
  restaurantOwner,
  restaurantController.acceptPartnerContract
);

router.post(
  "/add-food",
  AuthCheck,
  restaurantOwner,
  upload.single("image"),
  restaurantController.addFood
);

router.delete("/food/:id", restaurantOwner, restaurantController.deleteFood);

router.get("/food/list", AuthCheck, restaurantOwner, restaurantController.getAllFoods);

router.get("/food/details/:id", restaurantOwner, restaurantController.getFoodById);

router.get(
  "/my-restaurant",
  AuthCheck,
  restaurantOwner,
  restaurantController.getMyRestaurant
);

module.exports = router;

const express = require("express");

const router = express.Router();

const AuthCheck = require("../middleware/authMiddleware");
const upload = require("../middleware/image");
const restaurantController = require("../controller/restaurantController.js");
const verifyRestaurant = require("../middleware/verifyrestaurant.js");
const authorizeRoles = require("../middleware/roleMiddleware.js");
router.post(
  "/auth/apply/restaurant",
  AuthCheck,
  restaurantController.applyRestaurant,
);
router.post("/restaurant/otp", AuthCheck, authorizeRoles("user"), restaurantController.verifyRestaurantOtp);
router.post(
  "/restaurant/details",
  AuthCheck,
  authorizeRoles("user"),
  restaurantController.restaurantDetails,
);

router.post(
  "/restaurant/resend-otp",
  AuthCheck,
  restaurantController.resendRestaurantOtp
);

router.post(
  "/restaurant/documents",
  AuthCheck,
  authorizeRoles("user"),
  restaurantController.restaurantDoc,
);

router.post(
  "/partner-contract",
  AuthCheck,
  authorizeRoles("user"),
  restaurantController.acceptPartnerContract
);

router.post(
  "/add-food",
  (req, res, next) => {
    console.log("1. Route");
    next();
  },
  AuthCheck,
  authorizeRoles("restaurant_owner"),
  upload.single("image"),
  restaurantController.addFood
);

router.delete(
  "/food/:id",
  AuthCheck,
  authorizeRoles("restaurant_owner"),
  restaurantController.deleteFood
);
router.get("/food/list", AuthCheck, authorizeRoles("restaurant_owner"), restaurantController.getAllFoods);

router.get("/food/details/:id", AuthCheck, authorizeRoles("restaurant_owner"), restaurantController.getFoodById);

router.get(
  "/my-restaurant",
  AuthCheck,
  authorizeRoles("restaurant_owner"),
  restaurantController.getMyRestaurant
);

router.patch(
  "/:id/toggle-availability",
  AuthCheck,
  authorizeRoles("restaurant_owner"),
  restaurantController.toggleAvailability
);

router.post(
  "/food/edit/:id",
  AuthCheck,
  verifyRestaurant,
  authorizeRoles("restaurant_owner"),
  upload.single("image"),
  restaurantController.editmenu
);

router.patch(
  "/restaurant/status",
  AuthCheck,
  verifyRestaurant,
  restaurantController.restaurantStatus
);


router.get(
  "/restaurant/orders",
  AuthCheck,
  verifyRestaurant,
  authorizeRoles("restaurant_owner"),
  restaurantController.restaurantOrders
);

// router.patch(
//   "/push-subscribe",
//   AuthCheck,
//   authorizeRoles("restaurant_owner"),
//   verifyRestaurant,
//   restaurantController.savePushSubscription
// );

module.exports = router;

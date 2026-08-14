const express = require("express");
const authController = require("../controller/authController");
const router = express.Router();
const AuthCheck = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/allowRoles");

router.post("/auth/register", authController.signUp);

router.post("/auth/otp", authController.userOtp);
router.post("/auth/login", authController.signIn);
router.post("/refresh-token", authController.refreshToken);
router.post("/add/cart", AuthCheck, authController.addToCart);
router.get("/list/cart", AuthCheck, authController.cartList);
router.delete("/cart/item/:foodId", AuthCheck, authController.removeDataCart);

router.post("/order/place", AuthCheck, authController.placeOrder);
router.get("/orders/my-orders", AuthCheck, authController.myOrder);
router.get("/orders/:id", AuthCheck, authController.singleOrder);
router.put("/orders/:id/cancel", AuthCheck, authController.cancelOrder);
router.put(
  "/orders/:id/status",
  AuthCheck,
  allowRoles("restaurant_owner", "admin"),
  authController.updateOrderStatus,
);
module.exports = router;

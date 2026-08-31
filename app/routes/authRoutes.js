const express = require("express");

const authController = require("../controller/authController");

const router = express.Router();

const AuthCheck = require("../middleware/authMiddleware");

const allowRoles = require("../middleware/allowRoles");


// =====================================================
// USER REGISTRATION
// =====================================================

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password@123
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid request or user already exists
 *       500:
 *         description: Internal server error
 */
router.post(
  "/auth/register",
  authController.signUp
);


// =====================================================
// LOGOUT
// =====================================================

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Logout user
 *     description: Logout the currently authenticated user.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Logout successful
 *       500:
 *         description: Internal server error
 */
router.post(
  "/logout",
  authController.logout
);


// =====================================================
// VERIFY USER OTP
// =====================================================

/**
 * @swagger
 * /auth/otp:
 *   post:
 *     summary: Verify user OTP
 *     description: Verify the OTP sent to the user during registration or verification.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Internal server error
 */
router.post(
  "/auth/otp",
  authController.userOtp
);


// =====================================================
// USER LOGIN
// =====================================================

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Login using email and password.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password@123
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid email or password
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/auth/login",
  authController.signIn
);


// =====================================================
// REFRESH TOKEN
// =====================================================

/**
 * @swagger
 * /refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: Generate a new access token using a refresh token.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Internal server error
 */
router.post(
  "/refresh-token",
  authController.refreshToken
);


// =====================================================
// ADD TO CART
// =====================================================

/**
 * @swagger
 * /add/cart:
 *   post:
 *     summary: Add food to cart
 *     description: Add a food item to the authenticated user's cart.
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - foodId
 *               - quantity
 *             properties:
 *               foodId:
 *                 type: string
 *                 example: 64f123456789abcdef123456
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *     responses:
 *       200:
 *         description: Food added to cart successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Food not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/add/cart",
  AuthCheck,
  authController.addToCart
);


// =====================================================
// CART LIST
// =====================================================

/**
 * @swagger
 * /list/cart:
 *   get:
 *     summary: Get cart
 *     description: Get the authenticated user's cart items.
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/list/cart",
  AuthCheck,
  authController.cartList
);


// =====================================================
// REMOVE CART ITEM
// =====================================================

/**
 * @swagger
 * /cart/item/{foodId}:
 *   delete:
 *     summary: Remove food from cart
 *     description: Remove a specific food item from the authenticated user's cart.
 *     tags:
 *       - Cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: foodId
 *         required: true
 *         schema:
 *           type: string
 *         description: Food ID
 *         example: 64f123456789abcdef123456
 *     responses:
 *       200:
 *         description: Cart item removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Food or cart item not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/cart/item/:foodId",
  AuthCheck,
  authController.removeDataCart
);


// =====================================================
// PLACE ORDER
// =====================================================

/**
 * @swagger
 * /order/place:
 *   post:
 *     summary: Place an order
 *     description: Place an order using the authenticated user's cart.
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 *                 example: 123 Main Street, Kolkata
 *     responses:
 *       201:
 *         description: Order placed successfully
 *       400:
 *         description: Invalid order data or cart is empty
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart or food not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/order/place",
  AuthCheck,
  authController.placeOrder
);


// =====================================================
// MY ORDERS
// =====================================================

/**
 * @swagger
 * /orders/my-orders:
 *   get:
 *     summary: Get my orders
 *     description: Get all orders placed by the authenticated user.
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/orders/my-orders",
  AuthCheck,
  authController.myOrder
);


// =====================================================
// SINGLE ORDER
// =====================================================

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get single order
 *     description: Get details of a specific order.
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: 64f123456789abcdef123456
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/orders/:id",
  AuthCheck,
  authController.singleOrder
);


// =====================================================
// CANCEL ORDER
// =====================================================

/**
 * @swagger
 * /orders/{id}/cancel:
 *   put:
 *     summary: Cancel order
 *     description: Cancel an existing order.
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: 64f123456789abcdef123456
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Order cannot be cancelled
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/orders/:id/cancel",
  AuthCheck,
  authController.cancelOrder
);


// =====================================================
// UPDATE ORDER STATUS
// =====================================================

/**
 * @swagger
 * /orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     description: Restaurant owner or admin can update the order status.
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: 64f123456789abcdef123456
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - pending
 *                   - confirmed
 *                   - preparing
 *                   - ready
 *                   - out_for_delivery
 *                   - delivered
 *                   - cancelled
 *                 example: confirmed
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid status or invalid status transition
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/orders/:id/status",
  AuthCheck,
  allowRoles("restaurant_owner", "admin"),
  authController.updateOrderStatus
);


module.exports = router;
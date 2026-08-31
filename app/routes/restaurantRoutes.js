const express = require("express");

const router = express.Router();

const AuthCheck = require("../middleware/authMiddleware");

const upload = require("../middleware/image");

const restaurantController = require("../controller/restaurantController.js");

const verifyRestaurant = require("../middleware/verifyrestaurant.js");

const authorizeRoles = require("../middleware/roleMiddleware.js");


// =====================================================
// APPLY FOR RESTAURANT
// =====================================================

/**
 * @swagger
 * /auth/apply/restaurant:
 *   post:
 *     summary: Apply for restaurant
 *     description: Submit a request to become a restaurant owner.
 *     tags:
 *       - Restaurant
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Restaurant application submitted successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/auth/apply/restaurant",
  AuthCheck,
  restaurantController.applyRestaurant
);


// =====================================================
// VERIFY RESTAURANT OTP
// =====================================================

/**
 * @swagger
 * /restaurant/otp:
 *   post:
 *     summary: Verify restaurant OTP
 *     description: Verify the OTP sent during restaurant registration.
 *     tags:
 *       - Restaurant
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/restaurant/otp",
  AuthCheck,
  authorizeRoles("user"),
  restaurantController.verifyRestaurantOtp
);


// =====================================================
// RESTAURANT DETAILS
// =====================================================

/**
 * @swagger
 * /restaurant/details:
 *   post:
 *     summary: Add restaurant details
 *     description: Add restaurant information during restaurant onboarding.
 *     tags:
 *       - Restaurant
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               restaurantName:
 *                 type: string
 *                 example: Tasty Food Restaurant
 *               location:
 *                 type: string
 *                 example: Kolkata
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       200:
 *         description: Restaurant details added successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/restaurant/details",
  AuthCheck,
  authorizeRoles("user"),
  restaurantController.restaurantDetails
);


// =====================================================
// RESEND RESTAURANT OTP
// =====================================================

/**
 * @swagger
 * /restaurant/resend-otp:
 *   post:
 *     summary: Resend restaurant OTP
 *     description: Resend OTP for restaurant verification.
 *     tags:
 *       - Restaurant
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/restaurant/resend-otp",
  AuthCheck,
  restaurantController.resendRestaurantOtp
);


// =====================================================
// RESTAURANT DOCUMENTS
// =====================================================

/**
 * @swagger
 * /restaurant/documents:
 *   post:
 *     summary: Upload restaurant documents
 *     description: Submit required documents for restaurant verification.
 *     tags:
 *       - Restaurant
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Restaurant verification document
 *     responses:
 *       200:
 *         description: Documents submitted successfully
 *       400:
 *         description: Invalid document
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/restaurant/documents",
  AuthCheck,
  authorizeRoles("user"),
  restaurantController.restaurantDoc
);


// =====================================================
// PARTNER CONTRACT
// =====================================================

/**
 * @swagger
 * /partner-contract:
 *   post:
 *     summary: Accept partner contract
 *     description: Accept the restaurant partner agreement.
 *     tags:
 *       - Restaurant
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Partner contract accepted successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/partner-contract",
  AuthCheck,
  authorizeRoles("user"),
  restaurantController.acceptPartnerContract
);


// =====================================================
// ADD FOOD
// =====================================================

/**
 * @swagger
 * /add-food:
 *   post:
 *     summary: Add new food
 *     description: Restaurant owner can add a new food item with an optional image.
 *     tags:
 *       - Restaurant Food
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - itemName
 *               - description
 *               - basePrice
 *             properties:
 *               itemName:
 *                 type: string
 *                 example: Chicken Biryani
 *               description:
 *                 type: string
 *                 example: Delicious chicken biryani
 *               basePrice:
 *                 type: number
 *                 example: 250
 *               foodType:
 *                 type: string
 *                 example: Main Course
 *               isVeg:
 *                 type: boolean
 *                 example: false
 *               category:
 *                 type: string
 *                 example: Biryani
 *               cuisine:
 *                 type: string
 *                 example: Indian
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Food image
 *     responses:
 *       201:
 *         description: Food added successfully
 *       400:
 *         description: Invalid food data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
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


// =====================================================
// DELETE FOOD
// =====================================================

/**
 * @swagger
 * /food/{id}:
 *   delete:
 *     summary: Delete food
 *     description: Restaurant owner can delete a food item.
 *     tags:
 *       - Restaurant Food
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Food ID
 *         example: 64f123456789abcdef123456
 *     responses:
 *       200:
 *         description: Food deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Food not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/food/:id",
  AuthCheck,
  authorizeRoles("restaurant_owner"),
  restaurantController.deleteFood
);


// =====================================================
// GET ALL FOODS
// =====================================================

/**
 * @swagger
 * /food/list:
 *   get:
 *     summary: Get all restaurant foods
 *     description: Get all foods belonging to the logged-in restaurant owner.
 *     tags:
 *       - Restaurant Food
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Food list retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get(
  "/food/list",
  AuthCheck,
  authorizeRoles("restaurant_owner"),
  restaurantController.getAllFoods
);


// =====================================================
// GET FOOD DETAILS
// =====================================================

/**
 * @swagger
 * /food/details/{id}:
 *   get:
 *     summary: Get food details
 *     description: Get details of a specific food item.
 *     tags:
 *       - Restaurant Food
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Food ID
 *         example: 64f123456789abcdef123456
 *     responses:
 *       200:
 *         description: Food details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Food not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/food/details/:id",
  AuthCheck,
  authorizeRoles("restaurant_owner"),
  restaurantController.getFoodById
);


// =====================================================
// GET MY RESTAURANT
// =====================================================

/**
 * @swagger
 * /my-restaurant:
 *   get:
 *     summary: Get my restaurant
 *     description: Get restaurant details of the logged-in restaurant owner.
 *     tags:
 *       - Restaurant
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Restaurant details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/my-restaurant",
  AuthCheck,
  authorizeRoles("restaurant_owner"),
  restaurantController.getMyRestaurant
);


// =====================================================
// TOGGLE FOOD AVAILABILITY
// =====================================================

/**
 * @swagger
 * /{id}/toggle-availability:
 *   patch:
 *     summary: Toggle food availability
 *     description: Restaurant owner can change the availability of a food item.
 *     tags:
 *       - Restaurant Food
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Food ID
 *         example: 64f123456789abcdef123456
 *     responses:
 *       200:
 *         description: Food availability updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Food not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/:id/toggle-availability",
  AuthCheck,
  authorizeRoles("restaurant_owner"),
  restaurantController.toggleAvailability
);


// =====================================================
// EDIT FOOD
// =====================================================

/**
 * @swagger
 * /food/edit/{id}:
 *   post:
 *     summary: Edit food
 *     description: Restaurant owner can update food details and image.
 *     tags:
 *       - Restaurant Food
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Food ID
 *         example: 64f123456789abcdef123456
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               itemName:
 *                 type: string
 *                 example: Chicken Biryani
 *               description:
 *                 type: string
 *                 example: Delicious chicken biryani
 *               basePrice:
 *                 type: number
 *                 example: 250
 *               foodType:
 *                 type: string
 *                 example: Main Course
 *               isVeg:
 *                 type: boolean
 *                 example: false
 *               category:
 *                 type: string
 *                 example: Biryani
 *               cuisine:
 *                 type: string
 *                 example: Indian
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Food updated successfully
 *       400:
 *         description: Invalid food data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Food not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/food/edit/:id",
  AuthCheck,
  verifyRestaurant,
  authorizeRoles("restaurant_owner"),
  upload.single("image"),
  restaurantController.editmenu
);


// =====================================================
// RESTAURANT STATUS
// =====================================================

/**
 * @swagger
 * /restaurant/status:
 *   patch:
 *     summary: Update restaurant status
 *     description: Restaurant owner can open or close their restaurant.
 *     tags:
 *       - Restaurant
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isOpen
 *             properties:
 *               isOpen:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Restaurant status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/restaurant/status",
  AuthCheck,
  verifyRestaurant,
  restaurantController.restaurantStatus
);


// =====================================================
// RESTAURANT ORDERS
// =====================================================

/**
 * @swagger
 * /restaurant/orders:
 *   get:
 *     summary: Get restaurant orders
 *     description: Get all orders for the logged-in restaurant.
 *     tags:
 *       - Restaurant Orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Restaurant orders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/restaurant/orders",
  AuthCheck,
  verifyRestaurant,
  authorizeRoles("restaurant_owner"),
  restaurantController.restaurantOrders
);


// =====================================================
// PENDING FOOD COUNT
// =====================================================

/**
 * @swagger
 * /restaurant/foods/pending-count:
 *   get:
 *     summary: Get pending food count
 *     description: Get the number of food items waiting for admin approval.
 *     tags:
 *       - Restaurant Food
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending food count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 5
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/restaurant/foods/pending-count",
  AuthCheck,
  verifyRestaurant,
  authorizeRoles("restaurant_owner"),
  restaurantController.pendingFoodCount
);


// =====================================================
// PUSH SUBSCRIPTION
// =====================================================

// router.patch(
//   "/push-subscribe",
//   AuthCheck,
//   authorizeRoles("restaurant_owner"),
//   verifyRestaurant,
//   restaurantController.savePushSubscription
// );


module.exports = router;
const express = require("express");

const userController = require("../controller/userController");

const router = express.Router();

const AuthCheck = require("../middleware/authMiddleware");

const allowRoles = require("../middleware/allowRoles");

const authorizeRoles = require("../middleware/roleMiddleware");


// =====================================================
// USER FOOD LIST
// =====================================================

/**
 * @swagger
 * /user/food_list:
 *   get:
 *     summary: Get food list
 *     description: Get the list of available published foods for the logged-in user.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Food list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Something went wrong
 */
router.get(
  "/user/food_list",
  AuthCheck,
  authorizeRoles("user"),
  userController.userfoodlist
);


// =====================================================
// USER RESTAURANT LIST
// =====================================================

/**
 * @swagger
 * /user/restaurant-list:
 *   get:
 *     summary: Get restaurant list
 *     description: Get the list of approved restaurants available to users.
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: Restaurant list retrieved successfully
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
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Something went wrong
 */
router.get(
  "/user/restaurant-list",
  userController.userRestaurantList
);


// =====================================================
// USER RESTAURANT FOOD LIST
// =====================================================

/**
 * @swagger
 * /user/restaurant/{restaurantId}/foods:
 *   get:
 *     summary: Get foods of a restaurant
 *     description: Get all available foods from a specific restaurant.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant ID
 *         example: 64f123456789abcdef123456
 *     responses:
 *       200:
 *         description: Restaurant food list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid restaurant ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Something went wrong
 */
router.get(
  "/user/restaurant/:restaurantId/foods",
  AuthCheck,
  authorizeRoles("user"),
  userController.userRestaurantFoodList
);


module.exports = router;
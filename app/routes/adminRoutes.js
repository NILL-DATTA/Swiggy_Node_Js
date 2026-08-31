const express = require("express");

const router = express.Router();

const adminController = require("../controller/adminController");

const upload = require("../middleware/image");

const AuthCheck = require("../middleware/authMiddleware");

const authorizeRoles = require("../middleware/roleMiddleware");


// =====================================================
// UPDATE RESTAURANT STATUS
// =====================================================

/**
 * @swagger
 * /admin/update-restaurant/{id}:
 *   put:
 *     summary: Update restaurant status
 *     description: Admin can approve or reject a restaurant.
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant ID
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
 *                   - approved
 *                   - rejected
 *                 example: approved
 *               reason:
 *                 type: string
 *                 example: Restaurant documents are incomplete
 *     responses:
 *       200:
 *         description: Restaurant status updated successfully
 *       400:
 *         description: Invalid status or restaurant status cannot be changed
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/admin/update-restaurant/:id",
  adminController.updateRestaurantStatus
);


// =====================================================
// GET APPROVED RESTAURANTS
// =====================================================

/**
 * @swagger
 * /admin/restaurants/approved:
 *   get:
 *     summary: Get approved restaurants
 *     description: Get all restaurants that have been approved by admin.
 *     tags:
 *       - Admin
 *     responses:
 *       200:
 *         description: Approved restaurants retrieved successfully
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
  "/admin/restaurants/approved",
  adminController.approvedRestaurants
);


// =====================================================
// GET PENDING RESTAURANTS
// =====================================================

/**
 * @swagger
 * /admin/restaurants/pending:
 *   get:
 *     summary: Get pending restaurants
 *     description: Get all restaurants waiting for admin approval.
 *     tags:
 *       - Admin
 *     responses:
 *       200:
 *         description: Pending restaurants retrieved successfully
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
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Something went wrong
 */
router.get(
  "/admin/restaurants/pending",
  adminController.pendingRestaurants
);


// =====================================================
// DELETE RESTAURANT
// =====================================================

/**
 * @swagger
 * /restaurant/delete/{id}:
 *   delete:
 *     summary: Delete restaurant
 *     description: Delete a restaurant and all foods related to that restaurant.
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant ID
 *         example: 64f123456789abcdef123456
 *     responses:
 *       200:
 *         description: Restaurant and related foods deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Restaurant and all related foods deleted successfully
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Something went wrong
 */
router.delete(
  "/restaurant/delete/:id",
  adminController.deleteRestaurant
);


// =====================================================
// UPDATE FOOD STATUS
// =====================================================

/**
 * @swagger
 * /food/{foodId}/status:
 *   patch:
 *     summary: Approve, reject or suspend food
 *     description: Admin can approve, reject, or suspend a food item.
 *     tags:
 *       - Admin
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
 *                   - approved
 *                   - rejected
 *                   - suspended
 *                 example: approved
 *               rejectedReason:
 *                 type: string
 *                 example: Food image is not clear
 *     responses:
 *       200:
 *         description: Food status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Food approved successfully.
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid status or food already has this status
 *       404:
 *         description: Food not found
 *       500:
 *         description: Something went wrong
 */
router.patch(
  "/food/:foodId/status",
  AuthCheck,
  authorizeRoles("admin"),
  adminController.approveFood
);


// =====================================================
// GET PENDING FOOD LIST
// =====================================================

/**
 * @swagger
 * /pending/foodlist:
 *   get:
 *     summary: Get pending food list
 *     description: Get all food items waiting for admin approval.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending food list retrieved successfully
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
  "/pending/foodlist",
  AuthCheck,
  authorizeRoles("admin"),
  adminController.pendingFoodList
);


module.exports = router;
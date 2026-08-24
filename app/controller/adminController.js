const Restaurant = require("../model/RestaurantModel/restaurantModel");
const User = require("../model/authModel");
const Food = require("../model/foodModel");
const slugify = require("slugify");
const path = require("path");
const fs = require("fs");
const { default: mongoose } = require("mongoose");
const { invalidatePattern } = require("../../services/redisservice");

class AdminController {
  async updateRestaurantStatus(req, res) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const { id } = req.params;
      const { status, reason } = req.body;

      // =========================
      // 1. Validate Status
      // =========================
      const allowedStatus = ["approved", "rejected"];

      if (!allowedStatus.includes(status)) {
        await session.abortTransaction();

        return res.status(400).json({
          status: false,
          message: "Invalid status value",
        });
      }

      // =========================
      // 2. Find Restaurant
      // =========================
      const restaurant = await Restaurant.findById(id).session(
        session
      );

      if (!restaurant) {
        await session.abortTransaction();

        return res.status(404).json({
          status: false,
          message: "Restaurant not found",
        });
      }

      // =========================
      // 3. Approved Cannot Change
      // =========================
      if (restaurant.status === "approved") {
        await session.abortTransaction();

        return res.status(400).json({
          status: false,
          message: "Approved restaurant cannot be changed",
        });
      }

      // =========================
      // 4. Same Status
      // =========================
      if (restaurant.status === status) {
        await session.abortTransaction();

        return res.status(400).json({
          status: false,
          message: `Restaurant already ${status}`,
        });
      }

      // =========================
      // 5. Update Restaurant
      // =========================
      restaurant.status = status;

      if (status === "rejected" && reason) {
        restaurant.rejectionReason = reason;
      }

      await restaurant.save({ session });

      // =========================
      // 6. Update User Role
      // =========================
      const user = await User.findById(
        restaurant.owner
      ).session(session);

      if (user) {
        if (status === "approved") {
          user.role = "restaurant_owner";
        } else if (status === "rejected") {
          user.role = "user";
        }

        await user.save({ session });
      }

      // =========================
      // 7. Commit Transaction
      // =========================
      await session.commitTransaction();

      session.endSession();

      const io = getIO();

      if (restaurant.owner) {
        const ownerRoom = `user_${restaurant.owner.toString()}`;

        io.to(ownerRoom).emit(
          "restaurant:status-updated",
          {
            restaurantId: restaurant._id,
            restaurantName: restaurant.restaurantName,
            status: restaurant.status,
            rejectionReason:
              restaurant.rejectionReason || null,
            message:
              status === "approved"
                ? "Your restaurant has been approved"
                : "Your restaurant has been rejected",
          }
        );

        console.log(
          `Restaurant status event emitted to ${ownerRoom}`
        );
      }

      return res.status(200).json({
        status: true,
        message: `Restaurant ${status} successfully`,
        data: {
          restaurantId: restaurant._id,
          status: restaurant.status,
          rejectionReason:
            restaurant.rejectionReason || null,
        },
      });
    } catch (err) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      session.endSession();

      console.error(
        "Update Restaurant Status Error:",
        err
      );

      return res.status(500).json({
        status: false,
        message: "Internal server error",
        error: err.message,
      });
    }
  }
  
  async rejectedApplication(req, res) {
    try {
      const { id } = req.params;

      const restaurant = await Restaurant.findById(id);

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found",
        });
      }

      if (restaurant.status === "rejected") {
        return res.status(400).json({
          success: false,
          message: "Restaurant is already rejected",
        });
      }

      restaurant.status = "rejected";
      await restaurant.save();

      return res.status(200).json({
        success: true,
        message: "Application rejected",
        data: restaurant,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  }

  async approvedRestaurants(req, res) {
    try {
      const restaurants = await Restaurant.find({
        status: "approved",
      }).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: restaurants.length,
        data: restaurants,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong",
        error: error.message,
      });
    }
  }

  async pendingRestaurants(req, res) {
    try {
      const restaurants = await Restaurant.find({
        status: "review_pending",
      }).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: restaurants.length,
        data: restaurants,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong",
        error: error.message,
      });
    }
  }

  async deleteRestaurant(req, res) {
    try {
      const { id } = req.params;

      const restaurant = await Restaurant.findById(id);

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found",
        });
      }

      await Food.deleteMany({
        restaurant: restaurant._id,
      });

      await Restaurant.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: "Restaurant and all related foods deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  async approveFood(req, res) {
    try {
      const { foodId } = req.params;
      const { status, rejectedReason } = req.body;

      const allowedStatuses = [
        "approved",
        "rejected",
        "suspended",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      const food = await Food.findOne({
        _id: foodId,
        isDeleted: false,
      });

      if (!food) {
        return res.status(404).json({
          success: false,
          message: "Food not found.",
        });
      }

      if (food.approvalStatus === status) {
        return res.status(400).json({
          success: false,
          message: `Food is already ${status}`,
        });
      }

      food.approvalStatus = status;

      // Approved
      if (status === "approved") {
        food.approvedAt = new Date();
        food.rejectedReason = "";
      }

      // Rejected
      if (status === "rejected") {
        food.approvedAt = null;
        food.rejectedReason =
          rejectedReason || "Food rejected by admin";
      }

      // Suspended
      if (status === "suspended") {
        food.approvedAt = null;
        food.rejectedReason = "";
      }

      await food.save();

      // Clear user food list cache
      await invalidatePattern("foods");

      return res.status(200).json({
        success: true,
        message: `Food ${status} successfully.`,
        data: food,
      });
    } catch (error) {
      console.error("Approve Food Error:", error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async pendingFoodList(req, res) {
    try {
      const foods = await Food.find({
        approvalStatus: "pending",
      })
        .populate(
          "restaurant",
          "restaurantName location status"
        )
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: foods.length,
        data: foods,
      });
    } catch (error) {
      console.error(
        "Pending Food List Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Something went wrong",
        error: error.message,
      });
    }
  }

}


module.exports = new AdminController();

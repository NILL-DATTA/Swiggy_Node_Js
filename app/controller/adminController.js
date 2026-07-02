const Restaurant = require("../model/RestaurantModel/restaurantModel");
const User = require("../model/authModel");
const Food = require("../model/foodModel");
const slugify = require("slugify");
const path = require("path");
const fs = require("fs");
const { default: mongoose } = require("mongoose");

class AdminController {
  async updateRestaurantStatus(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      // Validate status
      const allowedStatus = ["approved", "rejected"];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({
          status: false,
          message: "Invalid status value",
        });
      }

      // Find restaurant
      const restaurant = await Restaurant.findById(id).session(session);

      if (!restaurant) {
        await session.abortTransaction();
        return res.status(404).json({
          status: false,
          message: "Restaurant not found",
        });
      }

      if (restaurant.status === "approved") {
        await session.abortTransaction();
        return res.status(400).json({
          status: false,
          message: "Approved restaurant cannot be changed",
        });
      }

      if (restaurant.status === status) {
        await session.abortTransaction();
        return res.status(400).json({
          status: false,
          message: `Restaurant already ${status}`,
        });
      }

      //  Update restaurant
      restaurant.status = status;
      if (status === "rejected" && !reason) {
        restaurant.rejectionReason = reason;
      }

      await restaurant.save({ session });

      //  Update user role
      const user = await User.findById(restaurant.owner).session(session);

      if (user) {
        if (status === "approved") {
          user.role = "restaurant_owner";
        } else if (status === "rejected") {
          user.role = "user"; // fallback role
        }

        await user.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        status: true,
        message: `Restaurant ${status} successfully`,
        data: {
          restaurantId: restaurant._id,
          status: restaurant.status,
        },
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();

      return res.status(500).json({
        status: false,
        message: "Internal server error",
        error: err.message,
      });
    }
  }

  async updateApplicationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

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

      const restaurant = await Restaurant.findById(id);

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found",
        });
      }

      if (restaurant.status === status) {
        return res.status(400).json({
          success: false,
          message: `Restaurant is already ${status}`,
        });
      }

      restaurant.status = status;

      if (status === "approved") {
        restaurant.approvedAt = new Date();
      }

      if (status === "rejected") {
        restaurant.rejectedReason = reason || "";
      }

      // These fields are metadata. They store additional information about the status change.


      await restaurant.save();

      return res.status(200).json({
        success: true,
        message: `Restaurant ${status} successfully`,
        data: restaurant,
      });

    } catch (error) {
      console.error("Update Application Status Error:", error);

      return res.status(500).json({
        success: false,
        message: "Something went wrong",
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


  async deleteRestaurant  (req, res)  {
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

}


module.exports = new AdminController();

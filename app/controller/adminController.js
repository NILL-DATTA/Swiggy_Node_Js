const Restaurant = require("../model/RestaurantModel/restaurantModel");
const User = require("../model/authModel");
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

  async approveApplication(req, res) {
    try {
      const { id } = req.params;

      const restaurant = await Restaurant.findByIdAndUpdate(
        id,
        {
          status: "approved",
        },
        { new: true }
      );


      if (restaurant.status == "approved") {
        return res.status(404).json({
          success: false,
          message: "Restaurant is already approved",
        });
      }

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Application approved",
        data: restaurant,
      });
    } catch (error) {
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
}

module.exports = new AdminController();

const sendEmailverificationOtp = require("../helper/sendEmailverification");
const {
  regsiterValidate,
  otpValidate,
  loginvalidate,
} = require("../validator/authValidate");
const User = require("../model/authModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Otp = require("../model/otpmodel");
const Cart = require("../model/cartModel");
const Restaurant = require("../model/RestaurantModel/restaurantModel");
const { default: mongoose } = require("mongoose");
const Food = require("../model/foodModel");
const Order = require("../model/orderModel");

class AuthController {
  async signUp(req, res) {
    try {
      const { error, value } = regsiterValidate.validate(req.body);

      if (error) {
        return res.status(404).json({
          status: false,
          message: error.details.map((d) => d.message).join(", "),
        });
      }

      const { full_name, mobile_Number, email, address, password } = value;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(404).json({
          status: false,
          message: "Email already exists",
        });
      }

      const existingPh = await User.findOne({ mobile_Number });

      if (existingPh) {
        return res.status(404).json({
          status: false,
          message: "Mobile number already registered",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        full_name,
        email,
        mobile_Number,
        address,
        password: hashedPassword,
        role: "user",
        is_verified: false,
      });

      try {
        await sendEmailverificationOtp(newUser);
      } catch (err) {
        console.error("OTP send failed:", err.message);
      }

      return res.status(201).json({
        status: true,
        message: "User registered successfully. OTP sent to email.",
        data: {
          id: newUser._id,
          name: newUser.full_name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } catch (err) {
      console.error("Signup Error:", err);

      return res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  }

  async userOtp(req, res) {
    try {
      const { error, value } = otpValidate.validate(req.body);
      if (error) {
        return res.status(400).json({
          status: false,
          message: error.details.map((item) => item.message).join(),
        });
      }

      const { userId, otp } = value;

      console.log("Received userId:", userId);
      console.log("Received otp:", otp);

      const checkOtp = await Otp.findOne({
        userId: String(userId),
        otp: String(otp),
      });

      if (!checkOtp) {
        return res.status(400).json({
          status: false,
          message: "Invalid OTP, please request a new one",
        });
      }

      const existuser = await User.findById(userId);
      if (!existuser) {
        return res.status(400).json({
          status: false,
          message: "User not found",
        });
      }

      if (existuser.is_verified) {
        return res.status(400).json({
          status: false,
          message: "Email already verified",
        });
      }

      if (new Date() > checkOtp.expiresAt) {
        console.log("OTP expired, resending...");
        await Otp.deleteMany({ userId });
        await sendEmailverificationOtp(existuser);
        return res.status(400).json({
          status: false,
          message: "OTP expired, A new OTP has been sent to your email.",
        });
      }

      existuser.is_verified = true;
      await Otp.deleteMany({ userId });
      await existuser.save();

      res.status(200).json({
        status: true,
        message: "OTP verified successfully",
      });
    } catch (err) {
      console.log("OTP VERIFY ERROR:", err);
      return res.status(500).json({
        status: false,
        message: "Something went wrong. Please try again.",
      });
    }
  }

  async signIn(req, res) {
    try {
      const { error, value } = loginvalidate.validate(req.body);
      if (error) {
        return res.status(400).json({
          status: false,
          message: error.details.map((d) => d.message).join(", "),
        });
      }

      const { email, password } = value;

      const user = await User.findOne({ email }).select(
        "+password +refreshToken",
      );

      if (!user) {
        return res.status(401).json({
          status: false,
          message: "Invalid email or password",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          status: false,
          message: "Invalid email or password",
        });
      }

      if (!user.is_verified) {
        return res.status(403).json({
          status: false,
          message: `${user.role} not verified`,
        });
      }

      const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || "secretKey",
        { expiresIn: "30s" },
      );

      const refreshToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.REFRESH_TOKEN_SECRET || "refreshKey",
        { expiresIn: "7d" },
      );

      const hashedToken = await bcrypt.hash(refreshToken, 10);
      user.refreshToken = hashedToken;
      user.lastLogin = new Date();
      await user.save();

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        // secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        status: true,
        message: `${user.role} login successful`,
        data: {
          id: user._id,
          name: `${user.full_name}`,
          email: user.email,
          role: user.role,
        },
        accessToken,
        refreshToken,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  }

  async refreshToken(req, res) {
    try {
      // get refresh token from body
      const { refreshToken } = req.body;

      // check token exists
      if (!refreshToken) {
        return res.status(401).json({
          status: false,
          message: "Refresh token required",
        });
      }

      // verify refresh token
      let decoded;

      try {
        decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      } catch (error) {
        return res.status(403).json({
          status: false,
          message: "Invalid or expired refresh token",
        });
      }

      // find user
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found",
        });
      }

      // check stored refresh token
      if (!user.refreshToken) {
        return res.status(403).json({
          status: false,
          message: "Unauthorized",
        });
      }

      // compare refresh token with hashed token
      const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);

      if (!isMatch) {
        return res.status(403).json({
          status: false,
          message: "Refresh token mismatch",
        });
      }

      // generate new access token
      const newAccessToken = jwt.sign(
        {
          id: user._id,
          role: user.role,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "15m",
        },
      );

      // generate new refresh token
      const newRefreshToken = jwt.sign(
        {
          id: user._id,
          role: user.role,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "7d",
        },
      );

      // hash new refresh token
      const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);

      // save hashed refresh token
      user.refreshToken = hashedRefreshToken;

      await user.save();

      // response
      return res.status(200).json({
        status: true,
        message: "Token refreshed successfully",
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      return res.status(500).json({
        status: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async addToCart(req, res) {
    try {
      //  Auth check
      if (!req.user) {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }

      //  Role check (IMPORTANT)
      if (req.user.role !== "user") {
        return res.status(403).json({
          status: false,
          message: "Only users can add to cart",
        });
      }

      let { foodId, quantity } = req.body;

      // ✅ Validate input
      if (!foodId || !quantity) {
        return res.status(400).json({
          status: false,
          message: "foodId and quantity required",
        });
      }

      quantity = Number(quantity);

      if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({
          status: false,
          message: "Quantity must be greater than 0",
        });
      }

      if (quantity > 10) {
        return res.status(400).json({
          status: false,
          message: "Maximum 10 items allowed",
        });
      }

      //  Find food
      const food = await Food.findById(foodId);

      if (!food) {
        return res.status(404).json({
          status: false,
          message: "Food not found",
        });
      }

      if (!food.isAvailable) {
        return res.status(400).json({
          status: false,
          message: "Food is not available",
        });
      }

      //  Find restaurant
      const restaurant = await Restaurant.findById(food.restaurant);

      if (!restaurant || restaurant.status !== "approved") {
        return res.status(400).json({
          status: false,
          message: "Restaurant not available",
        });
      }

      //  Timing check
      if (!restaurant.openingTime || !restaurant.closingTime) {
        return res.status(400).json({
          status: false,
          message: "Restaurant timing not set",
        });
      }

      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const [openH, openM] = restaurant.openingTime.split(":");
      const [closeH, closeM] = restaurant.closingTime.split(":");

      const openTime = Number(openH) * 60 + Number(openM);
      const closeTime = Number(closeH) * 60 + Number(closeM);

      let isOpen;

      if (openTime < closeTime) {
        isOpen = currentTime >= openTime && currentTime <= closeTime;
      } else {
        // Overnight case
        isOpen = currentTime >= openTime || currentTime <= closeTime;
      }

      if (!isOpen) {
        return res.status(400).json({
          status: false,
          message: "Restaurant is closed now",
        });
      }

      // ✅ Find or create cart
      let cart = await Cart.findOne({ user: req.user.id });

      // ✅ One restaurant rule (Swiggy-style)
      if (cart && cart.restaurant.toString() !== food.restaurant.toString()) {
        cart.items = [];
        cart.restaurant = food.restaurant;
        cart.totalAmount = 0;
      }

      if (!cart) {
        cart = new Cart({
          user: req.user.id,
          restaurant: food.restaurant,
          items: [],
        });
      }

      //  Check if item exists
      const itemIndex = cart.items.findIndex(
        (item) => item.food.toString() === foodId,
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({
          food: foodId,
          quantity,
          price: food.price,
        });
      }

      //  Recalculate total
      cart.totalAmount = cart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );

      //  Save
      await cart.save();

      //  Populate response
      const updatedCart = await Cart.findById(cart._id)
        .populate("restaurant", "name")
        .populate("items.food", "name price");

      return res.status(200).json({
        status: true,
        message: "Item added to cart",
        data: updatedCart,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        status: false,
        message: "Internal server error",
        error: err.message,
      });
    }
  }

  async cartList(req, res) {
    try {
      const userId = req.user.id;

      console.log(userId, "userId");

      const cart = await Cart.findOne({ user: userId })
        .populate("restaurant")
        .populate("items.food");

      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      if (req.user.role !== "user") {
        return res.status(403).json({
          status: false,
          message: "Only users can add to cart",
        });
      }

      return res.status(200).json({
        status: true,
        message: "Cart item fetch successfully",
        data: cart,
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }

  async removeDataCart(req, res) {
    try {
      const { foodId } = req.params;

      if (!req.user) {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }

      const userId = req.user.id;

      if (req.user.role !== "user") {
        return res.status(403).json({
          status: false,
          message: "Only users can add to cart",
        });
      }

      const cart = await Cart.findOne({ user: userId });

      if (!cart) {
        return res.status(404).json({
          status: false,
          message: "Cart not found",
        });
      }

      const itemIndex = cart.items.findIndex(
        (item) => item.food.toString() === foodId,
      );

      if (itemIndex === -1) {
        return res.status(404).json({
          status: false,
          message: "Item not found in cart",
        });
      }

      if (cart.items[itemIndex].quantity > 1) {
        cart.items[itemIndex].quantity -= 1;
      } else {
        cart.items.splice(itemIndex, 1);
      }

      if (cart.items.length === 0) {
        await Cart.deleteOne({ _id: cart._id });

        return res.status(200).json({
          status: true,
          message: "Cart cleared",
        });
      }

      cart.totalAmount = cart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );

      await cart.save();

      return res.status(200).json({
        status: true,
        message: "Cart updated successfully",
        data: cart,
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: "Internal server error",
        error: err.message,
      });
    }
  }


  async refreshToken(req, res) {
    try {
      // get refresh token from body
      const { refreshToken } = req.body;

      // check token exists
      if (!refreshToken) {
        return res.status(401).json({
          status: false,
          message: "Refresh token required",
        });
      }

      // verify refresh token
      let decoded;

      try {
        decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      } catch (error) {
        return res.status(403).json({
          status: false,
          message: "Invalid or expired refresh token",
        });
      }
      console.log("decoded:", decoded);
      // find user
      const user = await User.findById(decoded.id).select("+refreshToken");

      console.log(user, "user");
      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found",
        });
      }

      // check stored refresh token
      if (!user.refreshToken) {
        return res.status(403).json({
          status: false,
          message: "Unauthorized",
        });
      }

      // compare refresh token with hashed token
      const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);

      if (!isMatch) {
        return res.status(403).json({
          status: false,
          message: "Refresh token mismatch",
        });
      }

      // generate new access token
      const newAccessToken = jwt.sign(
        {
          id: user._id,
          role: user.role,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "15m",
        },
      );

      // generate new refresh token
      const newRefreshToken = jwt.sign(
        {
          id: user._id,
          role: user.role,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "7d",
        },
      );

      // hash new refresh token
      const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);

      // save hashed refresh token
      user.refreshToken = hashedRefreshToken;

      await user.save();

      // response
      return res.status(200).json({
        status: true,
        message: "Token refreshed successfully",
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      return res.status(500).json({
        status: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async placeOrder(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      //  Auth check
      if (!req.user) {
        await session.abortTransaction();
        session.endSession();
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }

      //  Role check
      if (req.user.role !== "user") {
        await session.abortTransaction();
        session.endSession();
        return res.status(403).json({
          status: false,
          message: "Only users can place orders",
        });
      }

      //  Get cart
      const cart = await Cart.findOne({ user: req.user.id }).session(session);

      if (!cart) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          status: false,
          message: "Cart not found",
        });
      }

      if (!cart.items || cart.items.length === 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          status: false,
          message: "Cart is empty",
        });
      }

      //  Validate restaurant
      const restaurant = await Restaurant.findById(cart.restaurant).session(
        session,
      );

      if (!restaurant) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          status: false,
          message: "Restaurant not found",
        });
      }

      if (restaurant.status !== "approved") {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          status: false,
          message: "Restaurant is not available",
        });
      }

      // Validate address
      let { address } = req.body;

      if (
        !address ||
        typeof address !== "string" ||
        address.trim().length < 5
      ) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          status: false,
          message: "Valid delivery address required",
        });
      }

      address = address.trim();

      // Fetch foods
      const foodIds = cart.items.map((item) => item.food);

      const foods = await Food.find({ _id: { $in: foodIds } }).session(session);

      if (foods.length !== cart.items.length) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          status: false,
          message: "Some food items not found",
        });
      }

      //  Build food map
      const foodMap = {};
      foods.forEach((f) => {
        foodMap[f._id.toString()] = f;
      });

      //  Prepare order items
      const orderItems = [];
      let totalAmount = 0;

      for (let item of cart.items) {
        const food = foodMap[item.food.toString()];

        if (!food || !food.isAvailable) {
          throw new Error("Some food items are not available");
        }

        // Restaurant consistency
        if (food.restaurant.toString() !== cart.restaurant.toString()) {
          throw new Error("Invalid cart items (multiple restaurants)");
        }

        if (item.quantity <= 0) {
          throw new Error("Invalid quantity");
        }

        const price = food.price;

        orderItems.push({
          food: food._id,
          quantity: item.quantity,
          price,
        });

        totalAmount += price * item.quantity;
      }

      //  Create order
      const order = await Order.create(
        [
          {
            user: req.user.id,
            restaurant: cart.restaurant,
            items: orderItems,
            totalAmount,
            address,
            status: "placed",
          },
        ],
        { session },
      );

      //  Clear cart
      await Cart.findOneAndDelete({ user: req.user.id }).session(session);

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      //  Populate for response (UX improvement)
      const populatedOrder = await Order.findById(order[0]._id)
        .populate("restaurant", "name")
        .populate("items.food", "name price");

      return res.status(201).json({
        status: true,
        message: "Order placed successfully",
        data: populatedOrder,
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();

      console.error(err);

      return res.status(500).json({
        status: false,
        message: err.message || "Internal server error",
      });
    }
  }

  async myOrder(req, res) {
    try {
      const orders = await Order.find({ user: req.user.id })
        .populate("restaurant", "name")
        .populate("items.food", "name price")
        .sort({ createdAt: -1 });
      if (req.user.role !== "user") {
        return res.status(403).json({
          status: false,
          message: "Only users can see",
        });
      }

      return res.status(200).json({
        status: true,
        data: orders,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        status: false,
        message: "Failed to fetch orders",
      });
    }
  }

  async singleOrder(req, res) {
    try {
      const { id } = req.params;

      //  Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          status: false,
          message: "Invalid order ID",
        });
      }

      if (req.user.role !== "user") {
        return res.status(403).json({
          status: false,
          message: "Only users can see",
        });
      }

      //  Find order
      const order = await Order.findById(id)
        .populate("restaurant", "name")
        .populate("items.food", "name price");

      if (!order) {
        return res.status(404).json({
          status: false,
          message: "Order not found",
        });
      }

      //  Security: only owner can access
      if (order.user.toString() !== req.user.id) {
        return res.status(403).json({
          status: false,
          message: "Access denied",
        });
      }

      return res.status(200).json({
        status: true,
        data: order,
        message: "Order fetch successfully",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        status: false,
        message: "Failed to fetch order",
      });
    }
  }

  async cancelOrder(req, res) {
    try {
      let { id } = req.params;

      let order = await Order.findById(id);

      if (!order) {
        return res.status(400).json({
          status: false,
          message: "Order not found",
        });
      }

      if (req.user.role !== "user") {
        return res.status(403).json({
          status: false,
          message: "Only users can cancel",
        });
      }

      if (order.user.toString() !== req.user.id) {
        return res.status(403).json({
          status: false,
          message: "Access denied",
        });
      }

      if (!["placed", "confirmed"].includes(order.status)) {
        return res.status(400).json({
          status: false,
          message: "Order cannot be cancelled now",
        });
      }

      if (order.status === "cancelled") {
        return res.status(400).json({
          status: false,
          message: "Order already cancelled",
        });
      }

      if (order.status === "delivered") {
        return res.status(400).json({
          message: "Delivered order cannot be cancelled",
        });
      }

      order.status = "cancelled";
      await order.save();
      return res.status(201).json({
        status: true,
        message: "Order cancelled succesfully",
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: err,
      });
    }
  }

  async updateOrderStatus(req, res) {
    try {
      //  auth check
      if (!req.user) {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }

      //  role check
      if (!["restaurant_owner", "admin"].includes(req.user.role)) {
        return res.status(403).json({
          status: false,
          message: "Access denied",
        });
      }

      const { status } = req.body;

      //  order fetch + populate
      const order = await Order.findById(req.params.id).populate({
        path: "restaurant",
        select: "owner name",
      });

      if (!order) {
        return res.status(404).json({
          status: false,
          message: "Order not found",
        });
      }

      //  ownership check (only for restaurant_owner)
      if (
        req.user.role === "restaurant_owner" &&
        (!order.restaurant?.owner ||
          order.restaurant.owner.toString() !== req.user.id)
      ) {
        return res.status(403).json({
          status: false,
          message: "You can only update your own orders",
        });
      }

      //  status flow
      const statusFlow = {
        placed: "confirmed",
        confirmed: "preparing",
        preparing: "out_for_delivery",
        out_for_delivery: "delivered",
      };

      //  allow cancel separately
      if (status === "cancelled") {
        if (order.status === "delivered") {
          return res.status(400).json({
            status: false,
            message: "Delivered order cannot be cancelled",
          });
        }

        order.status = "cancelled";
        await order.save();
      } else {
        //  invalid status
        const allowedStatuses = [
          ...Object.keys(statusFlow),
          ...Object.values(statusFlow),
        ];

        if (!allowedStatuses.includes(status)) {
          return res.status(400).json({
            status: false,
            message: "Invalid status value",
          });
        }

        //  already finished
        if (["cancelled", "delivered"].includes(order.status)) {
          return res.status(400).json({
            status: false,
            message: "Order already completed",
          });
        }

        //  invalid transition
        if (statusFlow[order.status] !== status) {
          return res.status(400).json({
            status: false,
            message: "Invalid status transition",
          });
        }

        order.status = status;
        await order.save();
      }

      //  updated order
      const updatedOrder = await Order.findById(order._id)
        .populate("restaurant", "name")
        .populate("items.food", "name price");

      return res.status(200).json({
        status: true,
        message: "Order status updated",
        data: updatedOrder,
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }
}
module.exports = new AuthController();

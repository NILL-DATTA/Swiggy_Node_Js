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
      let { foodId, quantity } = req.body;

      if (!foodId || quantity === undefined || quantity === null) {
        return res.status(400).json({
          status: false,
          message: "foodId and quantity are required",
        });
      }

      quantity = Number(quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({
          status: false,
          message: "Quantity must be a positive integer",
        });
      }

      if (quantity > 10) {
        return res.status(400).json({
          status: false,
          message: "Maximum 10 items allowed",
        });
      }


      if (!mongoose.Types.ObjectId.isValid(foodId)) {
        return res.status(400).json({
          status: false,
          message: "Invalid foodId",
        });
      }

      const food = await Food.findById(foodId);

      if (!food) {
        return res.status(404).json({
          status: false,
          message: "Food not found",
        });
      }

      if (food.isDeleted) {
        return res.status(400).json({
          status: false,
          message: "Food is no longer available",
        });
      }

      if (food.approvalStatus !== "approved") {
        return res.status(400).json({
          status: false,
          message: "Food is not approved",
        });
      }


      if (!food.isAvailable) {
        return res.status(400).json({
          status: false,
          message: "Food is currently unavailable",
        });
      }

      const restaurant = await Restaurant.findById(food.restaurant);

      if (!restaurant) {
        return res.status(404).json({
          status: false,
          message: "Restaurant not found",
        });
      }


      if (restaurant.status !== "approved") {
        return res.status(400).json({
          status: false,
          message: "Restaurant is not available",
        });
      }


      const openingClosing = restaurant.openingClosing;

      if (
        !openingClosing ||
        !Array.isArray(openingClosing.slots) ||
        openingClosing.slots.length === 0
      ) {
        return res.status(400).json({
          status: false,
          message: "Restaurant timing not set",
        });
      }

      const now = new Date();

      const currentMinutes =
        now.getHours() * 60 + now.getMinutes();

      let isOpen = false;


      for (const slot of openingClosing.slots) {
        if (!slot.open || !slot.close) {
          continue;
        }

        const [openHour, openMinute] = slot.open
          .split(":")
          .map(Number);

        const [closeHour, closeMinute] = slot.close
          .split(":")
          .map(Number);

        const openTime =
          openHour * 60 + openMinute;

        const closeTime =
          closeHour * 60 + closeMinute;


        if (openTime < closeTime) {
          if (
            currentMinutes >= openTime &&
            currentMinutes <= closeTime
          ) {
            isOpen = true;
            break;
          }
        }

        else if (openTime > closeTime) {
          if (
            currentMinutes >= openTime ||
            currentMinutes <= closeTime
          ) {
            isOpen = true;
            break;
          }
        }

        else {
          isOpen = true;
          break;
        }
      }


      if (!isOpen) {
        return res.status(400).json({
          status: false,
          message: "Restaurant is closed now",
        });
      }

      const finalPrice =
        food.discountPrice > 0
          ? food.discountPrice
          : food.basePrice;


      let cart = await Cart.findOne({
        user: req.user.id,
      });

      let cartChangedRestaurant = false;


      if (
        cart &&
        cart.restaurant &&
        cart.restaurant.toString() !==
        food.restaurant.toString()
      ) {
        cart.items = [];
        cart.restaurant = food.restaurant;
        cart.totalAmount = 0;

        cartChangedRestaurant = true;
      }


      if (!cart) {
        cart = new Cart({
          user: req.user.id,
          restaurant: food.restaurant,
          items: [],
          totalAmount: 0,
        });
      }

      const itemIndex = cart.items.findIndex(
        (item) =>
          item.food.toString() === foodId.toString()
      );


      if (itemIndex !== -1) {
        const newQuantity =
          cart.items[itemIndex].quantity + quantity;

        if (newQuantity > 10) {
          return res.status(400).json({
            status: false,
            message:
              "Maximum 10 items allowed for this food",
          });
        }

        cart.items[itemIndex].quantity =
          newQuantity;

        cart.items[itemIndex].price =
          finalPrice;
      }

      else {
        cart.items.push({
          food: food._id,
          quantity: quantity,
          price: finalPrice,
        });
      }

      cart.totalAmount = cart.items.reduce(
        (total, item) => {
          return (
            total +
            item.price * item.quantity
          );
        },
        0
      );
      await cart.save();

      const updatedCart = await Cart.findById(
        cart._id
      )
        .populate(
          "restaurant",
          "name"
        )
        .populate(
          "items.food",
          "itemName basePrice discountPrice image foodType isVeg category cuisine"
        );


      return res.status(200).json({
        status: true,
        message: cartChangedRestaurant
          ? "Previous cart cleared and item added from new restaurant"
          : "Item added to cart",
        data: updatedCart,
      });
    } catch (error) {
      console.error(
        "Add To Cart Error:",
        error
      );

      return res.status(500).json({
        status: false,
        message: "Internal server error",
        error: error.message,
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

      if (req.user.role !== "user") {
        return res.status(403).json({
          status: false,
          message: "Only users can remove items from cart",
        });
      }

      const userId = req.user.id;

      const cart = await Cart.findOne({
        user: userId,
      });

      if (!cart) {
        return res.status(404).json({
          status: false,
          message: "Cart not found",
        });
      }

      const itemIndex = cart.items.findIndex(
        (item) => item.food.toString() === foodId.toString()
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
        await Cart.deleteOne({
          _id: cart._id,
        });

        return res.status(200).json({
          status: true,
          message: "Item removed and cart cleared",
          data: null,
        });
      }

      cart.totalAmount = cart.items.reduce(
        (total, item) =>
          total + item.price * item.quantity,
        0
      );

      await cart.save();

      return res.status(200).json({
        status: true,
        message: "Item removed from cart successfully",
        data: cart,
      });
    } catch (err) {
      console.error("Remove Cart Item Error:", err);

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

    try {
      session.startTransaction();

      const cart = await Cart.findOne({
        user: req.user.id,
      }).session(session);

      if (!cart) {
        await session.abortTransaction();

        return res.status(404).json({
          status: false,
          message: "Cart not found",
        });
      }

      if (!cart.items || cart.items.length === 0) {
        await session.abortTransaction();

        return res.status(400).json({
          status: false,
          message: "Cart is empty",
        });
      }

      const restaurant = await Restaurant.findById(
        cart.restaurant
      ).session(session);

      if (!restaurant) {
        await session.abortTransaction();

        return res.status(404).json({
          status: false,
          message: "Restaurant not found",
        });
      }

      if (restaurant.status !== "approved") {
        await session.abortTransaction();

        return res.status(400).json({
          status: false,
          message: "Restaurant is not available",
        });
      }


      let { address } = req.body;

      if (
        !address ||
        typeof address !== "string" ||
        address.trim().length < 5
      ) {
        await session.abortTransaction();

        return res.status(400).json({
          status: false,
          message: "Valid delivery address required",
        });
      }

      address = address.trim();


      const foodIds = cart.items.map((item) => item.food);


      const foods = await Food.find({
        _id: {
          $in: foodIds,
        },
      }).session(session);

      if (foods.length !== cart.items.length) {
        await session.abortTransaction();

        return res.status(400).json({
          status: false,
          message: "Some food items not found",
        });
      }


      const foodMap = {};

      foods.forEach((food) => {
        foodMap[food._id.toString()] = food;
      });


      const orderItems = [];

      let totalAmount = 0;

      for (const item of cart.items) {
        const food = foodMap[item.food.toString()];


        if (!food) {
          throw new Error(
            `Food item not found: ${item.food}`
          );
        }


        if (!food.isAvailable) {
          throw new Error(
            `${food.itemName || "Food item"} is not available`
          );
        }


        if (
          food.restaurant.toString() !==
          cart.restaurant.toString()
        ) {
          throw new Error(
            "Invalid cart items: multiple restaurants"
          );
        }

        const quantity = Number(item.quantity);

        if (
          !Number.isInteger(quantity) ||
          quantity <= 0
        ) {
          throw new Error(
            `Invalid quantity for food: ${food.itemName || food._id}`
          );
        }


        let price;

        if (
          food.discountPrice !== undefined &&
          food.discountPrice !== null &&
          food.discountPrice !== ""
        ) {
          price = Number(food.discountPrice);
        } else {
          price = Number(food.basePrice);
        }


        if (
          !Number.isFinite(price) ||
          price <= 0
        ) {
          throw new Error(
            `Invalid price for food: ${food.itemName || food._id
            }`
          );
        }


        const itemTotal = price * quantity;

        if (!Number.isFinite(itemTotal)) {
          throw new Error(
            `Invalid item total for food: ${food.itemName || food._id
            }`
          );
        }

        orderItems.push({
          food: food._id,
          quantity: quantity,
          price: price,
        });


        totalAmount += itemTotal;
      }


      if (
        !Number.isFinite(totalAmount) ||
        totalAmount <= 0
      ) {
        throw new Error("Invalid total amount");
      }


      totalAmount = Number(totalAmount.toFixed(2));


      const order = await Order.create(
        [
          {
            user: req.user.id,

            restaurant: cart.restaurant,

            items: orderItems,

            totalAmount: totalAmount,

            address: address,

            status: "placed",
          },
        ],
        {
          session,
        }
      );


      await Cart.findOneAndDelete({
        user: req.user.id,
      }).session(session);


      await session.commitTransaction();

      session.endSession();


      const populatedOrder = await Order.findById(
        order[0]._id
      )
        .populate(
          "restaurant",
          "name"
        )
        .populate(
          "items.food",
          "itemName basePrice discountPrice image foodType isVeg category cuisine"
        );


      return res.status(201).json({
        status: true,
        message: "Order placed successfully",
        data: populatedOrder,
      });
    } catch (err) {

      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      session.endSession();

      console.error(
        "Place Order Error:",
        err
      );

      return res.status(500).json({
        status: false,
        message:
          err.message ||
          "Internal server error",
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
      const { id } = req.params;

      const order = await Order.findById(id);

      if (!order) {
        return res.status(404).json({
          status: false,
          message: "Order not found",
        });
      }


      if (req.user.role !== "user") {
        return res.status(403).json({
          status: false,
          message: "Only users can cancel orders",
        });
      }


      if (order.user.toString() !== req.user.id.toString()) {
        return res.status(403).json({
          status: false,
          message: "Access denied",
        });
      }

      if (!["placed", "confirmed"].includes(order.status)) {
        return res.status(400).json({
          status: false,
          message: `Order cannot be cancelled when status is ${order.status}`,
        });
      }

      order.status = "cancelled";

      await order.save();

      return res.status(200).json({
        status: true,
        message: "Order cancelled successfully",
        data: order,
      });
    } catch (err) {
      console.error("Cancel Order Error:", err);

      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;


      const order = await Order.findById(id).populate({
        path: "restaurant",
        select: "owner restaurantName name",
      });

      if (!order) {
        return res.status(404).json({
          status: false,
          message: "Order not found",
        });
      }


      if (req.user.role === "restaurant_owner") {
        if (
          !order.restaurant?.owner ||
          order.restaurant.owner.toString() !== req.user.id.toString()
        ) {
          return res.status(403).json({
            status: false,
            message: "You can only update orders from your own restaurant",
          });
        }
      }

      const allowedStatuses = [
        "placed",
        "confirmed",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          status: false,
          message: "Invalid status value",
        });
      }


      if (["delivered", "cancelled"].includes(order.status)) {
        return res.status(400).json({
          status: false,
          message: `Order is already ${order.status}`,
        });
      }

      if (status === "cancelled") {
        const cancellableStatuses = [
          "placed",
          "confirmed",
        ];

        if (!cancellableStatuses.includes(order.status)) {
          return res.status(400).json({
            status: false,
            message: `Order cannot be cancelled when status is ${order.status}`,
          });
        }

        order.status = "cancelled";

        await order.save();
      } else {

        const statusFlow = {
          placed: "confirmed",
          confirmed: "preparing",
          preparing: "out_for_delivery",
          out_for_delivery: "delivered",
        };

        const nextStatus = statusFlow[order.status];


        if (!nextStatus) {
          return res.status(400).json({
            status: false,
            message: `Order cannot be updated from ${order.status}`,
          });
        }


        if (nextStatus !== status) {
          return res.status(400).json({
            status: false,
            message: `Invalid status transition. Order can only move from ${order.status} to ${nextStatus}`,
          });
        }


        order.status = status;

        await order.save();
      }


      const updatedOrder = await Order.findById(order._id)
        .populate(
          "restaurant",
          "restaurantName name"
        )
        .populate(
          "items.food",
          "name price"
        );


      return res.status(200).json({
        status: true,
        message: `Order ${status} successfully`,
        data: updatedOrder,
      });
    } catch (err) {
      console.error("Update Order Status Error:", err);

      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }
}
module.exports = new AuthController();

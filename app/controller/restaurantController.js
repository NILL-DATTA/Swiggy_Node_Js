const MobileSchema = require("../model/mobileModel");
const foodSchema = require("../model/foodModel");
const RestaurantSchema = require("../model/RestaurantModel/restaurantModel");
const { addFoodValidate } = require("../validator/foodvalidate");
const {
  restaurantValidate,
  restaurantDocumentsValidate,
  menuItemValidation,
} = require("../validator/restaurantValidate");
const client = require("../config/twilio");
const { redis } = require("../lib/redis");
const fs = require("fs");

class restaurantController {
  async addFood(req, res) {
    try {
      const { error, value } = addFoodValidate.validate(req.body);

      if (error) {
        return res.status(400).json({
          status: false,
          message: error.details.map((d) => d.message).join(", "),
        });
      }

      const { name, price, category, restaurantId, description } = value;

      if (req.user.role !== "restaurant_owner") {
        return res.status(403).json({
          status: false,
          message: "Only restaurant owner can add food",
        });
      }

      // Check restaurant exists
      const restaurant = await RestaurantSchema.findById(restaurantId);

      if (!restaurant) {
        return res.status(404).json({
          status: false,
          message: "Restaurant not found",
        });
      }

      if (restaurant.owner.toString() !== req.user.id) {
        return res.status(403).json({
          status: false,
          message: "You are not owner of this restaurant",
        });
      }

      // Create food item
      const food = await foodSchema.create({
        name,
        price,
        category,
        description,
        restaurant: restaurantId,
      });

      /* ---------------- REDIS PART START ---------------- */

      const cacheKey = `foods:${restaurantId}`;

      await redis.del(cacheKey);

      /* ---------------- REDIS PART END ---------------- */

      return res.status(201).json({
        status: true,
        message: "Food item added successfully",
        data: food,
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: "Internal server error",
        error: err.message,
      });
    }
  }
  async listFood(req, res) {
    try {
      const cacheKey = "all_foods";

      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        return res.status(200).json({
          status: true,
          message: "Foods fetched from cache",
          data: cachedData,
        });
      }

      const list = await foodSchema.find().sort({ createdAt: -1 });

      await redis.set(cacheKey, list, {
        ex: 300, // 5 min cache
      });

      return res.status(200).json({
        status: true,
        message: "Foods fetched from database",
        data: list,
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: "Internal server error",
        error: err.message,
      });
    }
  }

  async verifyRestaurantOtp(req, res) {
    try {
      const { phone, otp } = req.body;

      if (!phone || !otp) {
        return res.status(400).json({
          status: false,
          message: "Phone and OTP required",
        });
      }

      let formattedPhone = phone;

      if (!formattedPhone.startsWith("+")) {
        formattedPhone = `+91${formattedPhone}`;
      }

      const restaurant = await MobileSchema.findOne({
        phone: formattedPhone,
      });

      if (!restaurant) {
        return res.status(404).json({
          status: false,
          message: "Restaurant not found",
        });
      }

      // Twilio VERIFY CHECK (CORRECT METHOD)
      const verificationCheck = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({
          to: formattedPhone,
          code: String(otp),
        });

      console.log("VERIFY RESPONSE:", verificationCheck);

      if (verificationCheck.status !== "approved") {
        return res.status(400).json({
          status: false,
          message: "Invalid OTP",
        });
      }

      restaurant.isPhoneVerified = true;
      await restaurant.save();

      return res.status(200).json({
        status: true,
        message: "Phone verified successfully",
        data: restaurant,
      });
    } catch (error) {
      console.log("VERIFY ERROR:", error);

      return res.status(500).json({
        status: false,
        message: error.message,
      });
    }
  }

  async applyRestaurant(req, res) {
    try {
      const { phone } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }

      if (!phone) {
        return res.status(400).json({
          status: false,
          message: "Phone is required",
        });
      }

      let formattedPhone = phone;

      if (!formattedPhone.startsWith("+")) {
        formattedPhone = `+91${formattedPhone}`;
      }

      const existing = await MobileSchema.findOne({
        $or: [{ owner: userId }, { phone: formattedPhone }],
      });

      if (existing) {
        return res.status(400).json({
          status: false,
          message: "Already applied",
        });
      }

      // SEND OTP
      const verification = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({
          to: formattedPhone,
          channel: "sms",
        });

      console.log("VERIFY SID:", verification.sid);

      // SAVE USER
      const restaurant = await MobileSchema.create({
        phone: formattedPhone,
        owner: userId,
        verificationSid: verification.sid,
        isPhoneVerified: false,
      });

      return res.status(201).json({
        status: true,
        message: "OTP sent successfully",
        data: restaurant,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: false,
        message: error.message,
      });
    }
  }

  async restaurantDetails(req, res) {
    try {
      const { error, value } = restaurantValidate.validate(req.body);

      if (error) {
        return res.status(400).json({
          status: false,
          message: error.details.map((d) => d.message).join(", "),
        });
      }

      const {
        ownerName,
        restaurantName,
        location,
        email,
        phone,
        whatsappNumber,
        workingDays,
        openingClosing,
      } = value;

      const userId = req.user.id;
      const role = req.user.role;

      if (role !== "restaurant_owner") {
        return res.status(403).json({
          status: false,
          message: "Only restaurant owners can create restaurants",
        });
      }
      console.log(userId, "userId");
      if (!userId) {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }

      //check the existing restaurant
      const existingRestaurant = await RestaurantSchema.findOne({
        owner: userId,
      });

      if (existingRestaurant) {
        return res.status(400).json({
          status: false,
          message: "Restaurant already exists",
        });
      }

      const restaurant = await RestaurantSchema.create({
        owner: userId,
        ownerName,
        restaurantName,
        location,
        email,
        phone,
        whatsappNumber,
        workingDays,
        openingClosing,
        onboardingStep: 1,
        status: "draft",
      });

      return res.status(201).json({
        status: true,
        message: "Restaurant created successfully",
        data: restaurant,
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }

  async restaurantDoc(req, res) {
    try {
      const { error, value } = restaurantDocumentsValidate.validate(req.body);

      if (error) {
        return res.status(400).json({
          status: false,
          message: error.details.map((d) => d.message).join(", "),
        });
      }

      const {
        outletType,
        pan,
        gstin,
        ifscCode,
        bankAccountNumber,
        fssaiNumber,
      } = value;

      const userId = req.user.id;
      const role = req.user.role;

      if (role !== "restaurant_owner") {
        return res.status(403).json({
          status: false,
          message: "Only restaurant owners can create restaurants",
        });
      }

      if (!userId) {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }
      const existingRestaurant = await RestaurantSchema.findOne({
        owner: userId,
      });

      if (!existingRestaurant) {
        return res.status(404).json({
          status: false,
          message: "Restaurant not found. Complete step 1 first.",
        });
      }

      if (outletType) existingRestaurant.outletType = outletType;
      if (gstin) existingRestaurant.gstin = gstin;
      if (ifscCode) existingRestaurant.ifscCode = ifscCode;
      if (bankAccountNumber)
        existingRestaurant.bankAccountNumber = bankAccountNumber;
      if (fssaiNumber) existingRestaurant.fssaiNumber = fssaiNumber;
      if (pan) existingRestaurant.panNumber = pan;
      existingRestaurant.onboardingStep = 2;
      existingRestaurant.status = "documents_pending";

      await existingRestaurant.save();

      return res.status(200).json({
        status: true,
        message: "Restaurant documents saved successfully",
        data: existingRestaurant,
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }

  async restaurantMenu(req, res) {
    try {
      const {
        itemName,
        description,
        foodType,
        category,
        basePrice,
        discountPrice,
        gst,
        variants,
        addons,
        tags,
        isAvailable,
        enablePreOrder,
        allowSpecialInstructions,
        eligibleForOffers,
        preparationTime,
      } = req.body;

      const imageFile = req.file;

      if (!imageFile) {
        return res.status(400).json({
          status: false,
          message: "Image is required",
        });
      }

      const userId = req.user.id;

      const existingRestaurant = await RestaurantSchema.findOne({
        owner: userId,
      });

      if (!existingRestaurant) {
        return res.status(404).json({
          status: false,
          message: "Restaurant not found",
        });
      }

      existingRestaurant.menus.push({
        itemName,
        description,
        foodType,
        category,

        // ✅ FIX: diskStorage → use file path OR read file
        image: fs.readFileSync(imageFile.path, "base64"),

        basePrice,
        discountPrice,
        gst,

        variants: JSON.parse(variants || "[]"),
        addons: JSON.parse(addons || "[]"),
        tags: JSON.parse(tags || "[]"),

        isAvailable,
        enablePreOrder,
        allowSpecialInstructions,
        eligibleForOffers,

        preparationTime: JSON.parse(preparationTime || "{}"),
      });

      await existingRestaurant.save();

      return res.json({
        status: true,
        message: "Menu item added successfully",
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }
}

module.exports = new restaurantController();

const MobileSchema = require("../model/mobileModel");
const Food = require("../model/foodModel");
const RestaurantSchema = require("../model/RestaurantModel/restaurantModel");
const { addFoodValidate } = require("../validator/foodvalidate");
const {
  restaurantValidate,
  restaurantDocumentsValidate,
  menuItemValidation,
  partnerContractSchema,
} = require("../validator/restaurantValidate");
const client = require("../config/twilio");
const { redis } = require("../lib/redis");
const slugify = require("slugify");
const path = require("path");
const fs = require("fs");


class restaurantController {
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

      console.log("STATUS:", verificationCheck.status);

      if (verificationCheck.status !== "approved") {
        return res.status(400).json({
          status: false,
          message: "Invalid or expired OTP",
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

      // 1. Auth check
      if (!userId) {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }

      // 2. Phone validation
      if (!phone) {
        return res.status(400).json({
          status: false,
          message: "Phone is required",
        });
      }

      // 3. Format phone number (India default)
      const formattedPhone = phone.startsWith("+")
        ? phone
        : `+91${phone}`;

      // 4. Check existing application
      const existing = await MobileSchema.findOne({
        $or: [
          { owner: userId },
          { phone: formattedPhone }
        ],
      });

      if (existing) {
        return res.status(400).json({
          status: false,
          message: "Already applied with this phone",
        });
      }

      // 5. Create DB record FIRST (better flow)
      const restaurant = await MobileSchema.create({
        phone: formattedPhone,
        owner: userId,
        isPhoneVerified: false,
      });

      // 6. Send OTP via Twilio (IMPORTANT: separate try-catch)
      let verification;

      try {
        verification = await client.verify.v2
          .services(process.env.TWILIO_VERIFY_SERVICE_SID)
          .verifications.create({
            to: formattedPhone,
            channel: "sms",
          });

        console.log("TWILIO STATUS:", verification.status);
      } catch (err) {
        console.log("TWILIO ERROR:", err.code, err.message);

        // Optional: rollback DB entry if OTP fails
        await MobileSchema.findByIdAndDelete(restaurant._id);

        return res.status(400).json({
          status: false,
          message: "Failed to send OTP",
          error: err.message,
        });
      }

      // 7. Final success response
      return res.status(201).json({
        status: true,
        message: "OTP sent successfully",
        data: {
          id: restaurant._id,
          phone: formattedPhone,
          otpStatus: verification.status,
        },
      });

    } catch (error) {
      console.log("SERVER ERROR:", error.message);

      return res.status(500).json({
        status: false,
        message: "Internal Server Error",
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
      console.log("req.file:", req.file);
      console.log("req.body:", req.body);

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

      const isExists = existingRestaurant.menus.some(
        (menu) =>
          menu.itemName?.toLowerCase() === itemName?.toLowerCase() &&
          menu.category === category
      );

      if (isExists) {
        return res.status(400).json({
          status: false,
          message: "Menu item already exists",
        });
      }

      console.log("Saving:", imageFile.filename)
      const newMenu = {
        itemName,
        description,
        foodType,
        category,

        // Save filename only
        image: imageFile.filename,

        basePrice,
        discountPrice,
        gst,

        variants: variants ? JSON.parse(variants) : [],
        addons: addons ? JSON.parse(addons) : [],
        tags: tags ? JSON.parse(tags) : [],

        isAvailable:
          isAvailable === "true" || isAvailable === true,

        enablePreOrder:
          enablePreOrder === "true" || enablePreOrder === true,

        allowSpecialInstructions:
          allowSpecialInstructions === "true" ||
          allowSpecialInstructions === true,

        eligibleForOffers:
          eligibleForOffers === "true" ||
          eligibleForOffers === true,

        preparationTime: preparationTime
          ? JSON.parse(preparationTime)
          : {},
      };

      existingRestaurant.menus.push(newMenu);

      existingRestaurant.onboardingStep = 3;

      await existingRestaurant.save();

      const addedMenu =
        existingRestaurant.menus[
        existingRestaurant.menus.length - 1
        ];


      return res.status(201).json({
        status: true,
        message: "Menu item added successfully",
        data: {
          ...addedMenu.toObject(),

          imageUrl: `${req.protocol}://${req.get(
            "host"
          )}/uploads/${addedMenu.image}`,
        },
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }

  async acceptPartnerContract(req, res) {
    try {
      const { error, value } = partnerContractSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        return res.status(400).json({
          success: false,
          errors: error.details.map((err) => err.message),
        });
      }

      const ownerId = req.user.id;

      const {
        fullName,
        designation,
        date,
        place,
        declarationAccepted,
        reviewedSections,
      } = value;

      const restaurant = await RestaurantSchema.findOne({
        owner: ownerId,
      });

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found",
        });
      }

      console.log("Restaurant State:", {
        onboardingStep: restaurant.onboardingStep,
        status: restaurant.status,
      });

      // ---------------- STEP VALIDATION ----------------
      // Contract allowed only after documents step
      if (restaurant.onboardingStep < 2) {
        return res.status(400).json({
          success: false,
          message: "Complete restaurant details and documents first",
        });
      }

      // Already accepted check
      if (restaurant.contract?.accepted) {
        return res.status(409).json({
          success: false,
          message: "Contract already accepted",
        });
      }

      // ---------------- REQUIRED SECTION CHECK ----------------
      const requiredSections = [
        "terms_of_service",
        "commission_payment_terms",
        "operational_guidelines",
        "privacy_data_policy",
      ];

      const allReviewed = requiredSections.every((section) =>
        reviewedSections.includes(section)
      );

      if (!allReviewed) {
        return res.status(400).json({
          success: false,
          message: "Please review all contract sections",
        });
      }

      // ---------------- SAVE CONTRACT ----------------
      restaurant.contract = {
        accepted: true,
        acceptedAt: date || new Date(),
        contractVersion: "v1.0",
        reviewedSections,
        signatory: {
          fullName,
          designation,
          place,
        },
        declarationAccepted,
        ipAddress:
          req.headers["x-forwarded-for"] ||
          req.socket.remoteAddress,
        deviceInfo: req.headers["user-agent"],
      };

      // ---------------- UPDATE ONBOARDING ----------------
      restaurant.onboardingStep = 3;
      restaurant.status = "review_pending";

      await restaurant.save();

      return res.status(200).json({
        success: true,
        message: "Partner contract accepted successfully",
        data: {
          onboardingStep: restaurant.onboardingStep,
          status: restaurant.status,
          contractAccepted: true,
          acceptedAt: restaurant.contract.acceptedAt,
        },
      });
    } catch (error) {
      console.error("Contract Error:", error);

      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async addFood(req, res) {
    try {
      const {
        restaurantId,
        itemName,
        description,
        foodType,
        category,
        cuisine,
        basePrice,
        discountPrice,
        gst,
        preparationTime,
        isAvailable,
        isRecommended,
        isVeg,
      } = req.body;

      if (!restaurantId || !itemName || !category || !foodType || !basePrice) {
        return res.status(400).json({
          success: false,
          message: "Required fields are missing.",
        });
      }

      const restaurant = await RestaurantSchema.findById(restaurantId);

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found.",
        });
      }

      const existingFood = await Food.findOne({
        restaurant: restaurantId,
        itemName: itemName.trim(),
      });

      if (existingFood) {
        return res.status(409).json({
          success: false,
          message: "Food already exists.",
        });
      }

      let image = "";
      if (req.file) {
        image = `/uploads/${req.file.filename}`;
      }

      let discountPercentage = 0;
      if (discountPrice && Number(discountPrice) < Number(basePrice)) {
        discountPercentage = Math.round(
          ((basePrice - discountPrice) / basePrice) * 100
        );
      }

      const food = await Food.create({
        restaurant: restaurantId,
        itemName,
        slug: slugify(itemName, { lower: true, strict: true }),
        description,
        foodType,
        category,
        cuisine,
        basePrice,
        discountPrice,
        discountPercentage,
        gst,
        preparationTime,
        image,
        isVeg,
        isAvailable,
        isRecommended,
      });

      return res.status(201).json({
        success: true,
        message: "Food added successfully.",
        data: food,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteFood(req, res) {
    try {
      const food = await Food.findById(req.params.id);

      if (!food) {
        return res.status(404).json({
          success: false,
          message: "Food not found",
        });
      }

      if (food.image) {
        const imagePath = path.join(__dirname, "../../", food.image);

        try {
          fs.unlink(imagePath);
        } catch (err) {
          console.log("Image delete error:", err.message);
        }
      }

      await Food.findByIdAndDelete(req.params.id);

      return res.status(200).json({
        success: true,
        message: "Food deleted successfully",
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };


  async getAllFoods(req, res) {
    try {
      const foods = await Food.find()
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: foods.length,
        data: foods,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getFoodById(req, res) {
    try {
      const id = req.params.id;

      const food = await Food.findById(id)
      if (!food) {
        return res.status(404).json({
          success: false,
          message: "Food not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: food,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

}

module.exports = new restaurantController();

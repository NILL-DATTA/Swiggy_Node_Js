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
// const client = require("../config/twilio");
const UserSchema = require("../model/authModel");
const Order = require("../model/orderModel");

const slugify = require("slugify");
const path = require("path");
const Otp = require("../model/otpmodel");
const fs = require("fs");
const sendEmailverificationOtp = require("../helper/sendEmailverification");

const { default: mongoose } = require("mongoose");
const { getCache, setCache, deleteCache, invalidatePattern } = require("../../services/redisservice");
const { getIO } = require("../socket/socket");
const sendPushNotification = require("../../utils/sendNotification");


class restaurantController {
  async verifyRestaurantOtp(req, res) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          status: false,
          message: "Email and OTP are required",
        });
      }

      const restaurant = await MobileSchema.findOne({
        email: email.toLowerCase(),
      });

      if (!restaurant) {
        return res.status(404).json({
          status: false,
          message: "Restaurant application not found",
        });
      }

      const otpData = await Otp.findOne({
        userId: restaurant._id.toString(),
        otp: otp.toString(),
      });

      if (!otpData) {
        return res.status(400).json({
          status: false,
          message: "Invalid OTP",
        });
      }

      if (otpData.expiresAt < new Date()) {
        await Otp.deleteOne({ _id: otpData._id });

        return res.status(400).json({
          status: false,
          message: "OTP has expired",
        });
      }

      restaurant.isEmailVerified = true;
      await restaurant.save();

      await Otp.deleteOne({
        _id: otpData._id,
      });

      return res.status(200).json({
        status: true,
        message: "Email verified successfully",
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


  async resendRestaurantOtp(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          status: false,
          message: "Email is required",
        });
      }

      const normalizedEmail = email.toLowerCase().trim();

      const restaurant = await MobileSchema.findOne({
        email: normalizedEmail,
        owner: req.user.id,
      });

      if (!restaurant) {
        return res.status(404).json({
          status: false,
          message: "Restaurant application not found",
        });
      }

      if (restaurant.isEmailVerified) {
        return res.status(400).json({
          status: false,
          message: "Email is already verified",
        });
      }

      await sendEmailverificationOtp({
        _id: restaurant._id,
        email: restaurant.email,
        full_name: "Restaurant Owner",
      });

      return res.status(200).json({
        status: true,
        message: "OTP resent successfully",
        data: {
          id: restaurant._id,
          email: restaurant.email,
        },
      });
    } catch (error) {
      console.error("Resend OTP Error:", error);

      return res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async applyRestaurant(req, res) {
    try {
      const userId = req.user?.id;
      const { email } = req.body;

      if (!userId) {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }


      if (!email) {
        return res.status(400).json({
          status: false,
          message: "Email is required",
        });
      }

      const user = await UserSchema.findById(userId);

      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found",
        });
      }

      const requestedEmail = email.toLowerCase().trim();
      const loggedInEmail = user.email.toLowerCase().trim();

      if (requestedEmail !== loggedInEmail) {
        return res.status(403).json({
          status: false,
          message: "You can apply only with your logged-in email",
        });
      }

      const existing = await MobileSchema.findOne({
        owner: userId,
        email: loggedInEmail,
      });


      if (existing) {
        if (existing.isEmailVerified) {
          return res.status(400).json({
            status: false,
            message: "Email is already verified",
          });
        }

        return res.status(400).json({
          status: false,
          message:
            "Restaurant application already exists. Please resend OTP.",
          data: {
            id: existing._id,
            email: existing.email,
            isEmailVerified: existing.isEmailVerified,
          },
        });
      }

      const restaurant = await MobileSchema.create({
        owner: userId,
        email: loggedInEmail,
        isEmailVerified: false,
      });

      // Send OTP
      await sendEmailverificationOtp({
        _id: restaurant._id,
        email: restaurant.email,
        full_name: "Restaurant Owner",
      });

      return res.status(201).json({
        status: true,
        message: "OTP sent successfully",
        data: {
          id: restaurant._id,
          email: restaurant.email,
        },
      });
    } catch (error) {
      console.log("Apply Restaurant Error:", error);

      return res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
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

      // if (role !== "restaurant_owner") {
      //   return res.status(403).json({
      //     status: false,
      //     message: "Only restaurant owners can create restaurants",
      //   });
      // }
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

      // if (role !== "restaurant_owner") {
      //   return res.status(403).json({
      //     status: false,
      //     message: "Only restaurant owners can create restaurants",
      //   });
      // }

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

      // Find restaurant of logged-in owner
      const restaurant = await RestaurantSchema.findOne({
        owner: req.user.id,
      });

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found.",
        });
      }

      // Only approved restaurant can add food
      if (restaurant.status !== "approved") {
        return res.status(403).json({
          success: false,
          message: "Only approved restaurants can add food.",
        });
      }

      // Food name validation
      if (!itemName || !itemName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Food name is required.",
        });
      }

      // Check duplicate food
      const existingFood = await Food.findOne({
        restaurant: restaurant._id,
        itemName: itemName.trim(),
        isDeleted: false,
      });

      if (existingFood) {
        return res.status(409).json({
          success: false,
          message: "Food already exists.",
        });
      }


      const image = req.file
        ? `/uploads/${req.file.filename}`
        : "";


      let discountPercentage = 0;

      if (
        discountPrice &&
        Number(discountPrice) > 0 &&
        Number(discountPrice) < Number(basePrice)
      ) {
        discountPercentage = Math.round(
          ((Number(basePrice) - Number(discountPrice)) /
            Number(basePrice)) *
          100
        );
      }

      const food = await Food.create({
        restaurant: restaurant._id,

        itemName: itemName.trim(),

        slug: slugify(itemName, {
          lower: true,
          strict: true,
        }),

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

        approvalStatus: "pending",
      });

      // Clear restaurant food cache
      await invalidatePattern(`foods:${restaurant._id}:*`);

      return res.status(201).json({
        success: true,
        message: "Food added successfully. Waiting for admin approval.",
        data: food,
      });

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteFood(req, res) {
    try {
      const restaurant = await RestaurantSchema.findOne({
        owner: req.user.id,
      });

      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found",
        });
      }

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
          await fs.unlink(imagePath);
        } catch (err) {
          console.log("Image delete error:", err.message);
        }
      }

      await Food.findByIdAndDelete(req.params.id);


      await invalidatePattern(`foods:${restaurant._id}:*`);

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
  }

  async getAllFoods(req, res) {
    try {
      const restaurant = await RestaurantSchema.findOne({
        owner: req.user.id,
      });
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found.",
        });
      }

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const cacheKey = `foods:${restaurant._id}:page:${page}:limit:${limit}`;

      const cachedFoods = await getCache(cacheKey);

      if (cachedFoods) {
        return res.status(200).json({
          success: true,
          fromCache: true,
          message: "Food list fetched successfully.",
          pagination: cachedFoods.pagination,
          data: cachedFoods.data,
        });
      }

      const result = await Food.aggregate([
        {
          $match: {
            restaurant: restaurant._id,
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "restaurants",
            localField: "restaurant",
            foreignField: "_id",
            as: "restaurant",
          },
        },
        {
          $unwind: "$restaurant",
        },
        {
          $project: {
            _id: 1,
            itemName: 1,
            slug: 1,
            description: 1,
            image: 1,
            foodType: 1,
            isVeg: 1,
            category: 1,
            cuisine: 1,
            basePrice: 1,
            discountPrice: 1,
            discountPercentage: 1,
            gst: 1,
            preparationTime: 1,
            rating: 1,
            totalRatings: 1,
            totalOrders: 1,
            isAvailable: 1,
            isRecommended: 1,
            createdAt: 1,
            restaurantName: "$restaurant.restaurantName",
            restaurantEmail: "$restaurant.email",
            restaurantPhone: "$restaurant.phone",
          },
        },
        {
          $facet: {
            data: [
              { $sort: { createdAt: -1 } },
              { $skip: skip },
              { $limit: limit },
            ],
            totalCount: [{ $count: "count" }],
          },
        },
      ]);

      const foods = result[0]?.data || [];
      const total = result[0]?.totalCount?.[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      const response = {
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          limit,
        },
        data: foods,
      };

      await setCache(cacheKey, response, 60);

      return res.status(200).json({
        success: true,
        fromCache: false,
        message: "Food list fetched successfully.",
        ...response,
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

  async getMyRestaurant(req, res) {
    try {
      const restaurant = await RestaurantSchema.findOne({
        owner: req.user.id,
      });

      if (!restaurant) {
        return res.status(200).json({
          status: false,
          hasRestaurant: false,
          message: "Restaurant not found",
        });
      }

      return res.status(200).json({
        status: true,
        hasRestaurant: true,
        message: "Restaurant fetched successfully",
        data: restaurant,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  }

  async toggleAvailability(req, res) {
    try {
      const { id } = req.params;

      const item = await Food.findByIdAndUpdate(id,
        { returnDocument: "after" }
      );

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Menu item not found",
        });
      }

      item.isAvailable = !item.isAvailable;
      await item.save();

      getIO().emit("food:status", {
        foodId: item._id.toString(),
        itemName: item.itemName,
        isAvailable: item.isAvailable,
      });

      await invalidatePattern(`foods:${item.restaurant.toString()}`);

      res.status(200).json({
        success: true,
        message: item.isAvailable
          ? "Item is now available"
          : "Item marked as out of stock",
        data: item,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async editmenu(req, res) {
    try {

      const menuid = req.params.id

      const restaurant = await RestaurantSchema.findOne({
        owner: req.user.id,
      });
      const food = await Food.findById(req.params.id);
      console.log("Food:", food);

      const menufind = await Food.findOne({
        _id: menuid,
        restaurant: req.restaurant._id
      })

      console.log("Menu Find:", req.restaurant._id);
      const menu = await Food.findById(menuid);
      console.log("Menu Restaurant :", menu.restaurant.toString());
      console.log("Req Restaurant  :", req.restaurant._id.toString());

      if (!menufind) {
        return res.status(404).json({
          success: false,
          message: "Menu not find"
        })
      }

      menufind.itemName = req.body.itemName ?? menufind.itemName;
      menufind.description = req.body.description ?? menufind.description;
      menufind.foodType = req.body.foodType ?? menufind.foodType;
      menufind.isVeg = req.body.isVeg ?? menufind.isVeg;
      menufind.category = req.body.category ?? menufind.category;
      menufind.cuisine = req.body.cuisine ?? menufind.cuisine;
      menufind.basePrice = req.body.basePrice ?? menufind.basePrice;
      menufind.discountPrice = req.body.discountPrice ?? menufind.discountPrice;
      menufind.discountPercentage = req.body.discountPercentage ?? menufind.discountPercentage;
      menufind.gst = req.body.gst ?? menufind.gst;
      menufind.preparationTime = req.body.preparationTime ?? menufind.preparationTime;
      menufind.isAvailable = req.body.isAvailable ?? menufind.isAvailable;
      menufind.isRecommended = req.body.isRecommended ?? menufind.isRecommended;
      if (req.file) {
        menufind.image = `/uploads/${req.file.filename}`;
      }

      await menufind.save()

      await invalidatePattern(`foods:${restaurant._id}:*`);

      return res.status(200).json({
        status: true,
        message: "Menu Updated Successfully",
        data: menufind
      })

    } catch (err) {
      console.error(err);
      return res.status(500).json({
        status: false,
        message: err.message,
        stack: err.stack,
      });
    }

  }

  async restaurantStatus(req, res) {
    try {
      const { isOpen } = req.body;

      const restaurant = await RestaurantSchema.findByIdAndUpdate(
        req.restaurant._id,
        { isOpen },
        { returnDocument: "after" }
      );

      // Socket notification
      getIO().emit("restaurant:status", {
        restaurantId: restaurant._id.toString(),
        restaurantName: restaurant.restaurantName,
        isOpen: restaurant.isOpen,
      });

      console.log("Restaurant:", restaurant);
      console.log(
        "Push Subscription:",
        restaurant.pushSubscription
      );

      // Push notification
      // if (restaurant.pushSubscription) {
      //   try {
      //     await sendPushNotification(
      //       restaurant.pushSubscription,
      //       {
      //         title: restaurant.isOpen
      //           ? "Restaurant Open"
      //           : "Restaurant Closed",

      //         body: `${restaurant.restaurantName} is ${restaurant.isOpen ? "OPEN" : "CLOSED"
      //           } now.`,

      //         url: `/restaurant/${restaurant._id}`,
      //       }
      //     );

      //     console.log("Push notification sent");

      //   } catch (pushError) {
      //     console.error(
      //       "Push notification failed:",
      //       pushError.message
      //     );
      //   }
      // }

      // Main API success
      return res.status(200).json({
        success: true,
        message: "Restaurant status updated",
        data: restaurant,
      });

    } catch (err) {
      console.error("Restaurant status error:", err);

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
  async restaurantOrders(req, res) {
    try {
      const restaurantId = req.restaurant?._id;

      if (!restaurantId) {
        return res.status(401).json({
          status: false,
          message: "Restaurant authentication required",
        });
      }

      const orders = await Order.find({
        restaurant: restaurantId,
      })
        .populate("user", "name email phone")
        .populate(
          "items.food",
          "itemName basePrice discountPrice image foodType isVeg category cuisine"
        )
        .populate(
          "restaurant",
          "name email phone address status"
        )
        .sort({ createdAt: -1 });

      return res.status(200).json({
        status: true,
        message: "Restaurant orders fetched successfully",
        totalOrders: orders.length,
        data: orders,
      });
    } catch (error) {
      console.error("Restaurant Orders Error:", error);

      return res.status(500).json({
        status: false,
        message: error.message || "Internal server error",
      });
    }
  }
}

module.exports = new restaurantController();

// Food Collection
//       │
//       ▼
// $match
// → Restaurant-এর food এবং deleted নয় এমন document filter করি।

//       │
//       ▼
// $lookup
// → Restaurant collection-এর সাথে join করে restaurant-এর তথ্য নিয়ে আসি।

//       │
//       ▼
// $unwind
// → Lookup-এর ফলে পাওয়া restaurant array-কে object-এ convert করি, যাতে field access করা সহজ হয়।

//       │
//       ▼
// $project
// → Response-এ কোন কোন field থাকবে এবং restaurant-এর nested field-গুলোকে top-level-এ আনি।

//       │
//       ▼
// $sort
// → createdAt অনুযায়ী newest থেকে oldest order-এ সাজাই।
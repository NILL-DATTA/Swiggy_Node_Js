const mongoose = require("mongoose");

const RestaurantSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // STEP 1 : Basic Info
    ownerName: {
      type: String,
      trim: true,
    },

    restaurantName: {
      type: String,
      trim: true,
    },

    location: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    whatsappNumber: {
      type: String,
      trim: true,
    },

    // Business Category
    outletType: {
      type: String,
      enum: ["Restaurant", "Cloud Kitchen", "Cafe", "Bakery", "Sweet Shop"],
    },

    // Food Category
    foodType: {
      type: String,
      enum: ["VEG", "NON_VEG", "BOTH"],
    },

    // STEP 2 : Working Days & Timings
    workingDays: [
      {
        type: String,
        enum: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ],
      },
    ],

    openingClosing: {
      sameForAllDays: {
        type: Boolean,
        default: true,
      },

      slots: [
        {
          open: {
            type: String,
          },

          close: {
            type: String,
          },
        },
      ],
    },

    gstin: {
      type: String,
      trim: true,
      uppercase: true,
    },

    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },

    fssaiNumber: {
      type: String,
      trim: true,
    },

    bankAccountNumber: {
      type: String,
      trim: true,
    },

    ifscCode: {
      type: String,
      trim: true,
      uppercase: true,
    },

    // STEP 4 : Menu
    menus: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],

    // STEP 5 : Contract
    contractAccepted: {
      type: Boolean,
      default: false,
    },

    onboardingStep: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },

    menus: [
      {
        itemName: String,
        description: String,
        foodType: String,
        category: String,

        basePrice: Number,
        discountPrice: Number,

        image: String,

        variants: [
          {
            name: String,
            price: Number,
          },
        ],

        addons: [
          {
            name: String,
            price: Number,
          },
        ],

        tags: [String],

        isAvailable: Boolean,
      },
    ],
    status: {
      type: String,
      enum: [
        "draft",
        "documents_pending",
        "menu_pending",
        "contract_pending",
        "review_pending",
        "approved",
        "rejected",
      ],
      default: "draft",
    },
  },
  {
    timestamps: true,
  },
);

module.exports =
  mongoose.models.Restaurant || mongoose.model("Restaurant", RestaurantSchema);

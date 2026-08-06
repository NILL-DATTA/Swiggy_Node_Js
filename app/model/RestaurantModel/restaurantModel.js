const mongoose = require("mongoose");

const RestaurantSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    ownerName: {
      type: String,
      trim: true,
    },

    restaurantName: {
      type: String,
      trim: true,
      index: true,
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

    outletType: {
      type: String,
      enum: [
        "Restaurant",
        "Cloud Kitchen",
        "Cafe",
        "Bakery",
        "Sweet Shop",
      ],
    },
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
          open: String,
          close: String,
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

    documents: {
      gstCertificate: String,
      panCard: String,
      fssaiLicense: String,
      cancelledCheque: String,
    },

    contract: {
      accepted: {
        type: Boolean,
        default: false,
      },

      acceptedAt: Date,

      contractVersion: {
        type: String,
        default: "v1.0",
      },

      reviewedSections: [
        {
          type: String,
        },
      ],

      signatory: {
        fullName: String,
        designation: String,
        place: String,
      },

      declarationAccepted: {
        type: Boolean,
        default: false,
      },

      ipAddress: String,

      deviceInfo: String,
    },

    onboardingStep: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },

    isOpen: {
      type: Boolean,
      default: true,
    },

    pushSubscription: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
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
      index: true,
    },
    approvedAt: Date,
    rejectedReason: String,
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Restaurant ||
  mongoose.model("Restaurant", RestaurantSchema);
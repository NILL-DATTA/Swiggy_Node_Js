const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true
    },

    itemName: {
      type: String,
      required: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,

    },

    description: {
      type: String,
      default: "",
      trim: true,

    },

    image: {
      type: String,
      default: "",
    },


    foodType: {
      type: String,
      enum: ["Starter", "Main Course", "Dessert", "Beverage", "Snack"],
      required: true,

    },

    isVeg: {
      type: Boolean,
      default: true,

    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    cuisine: {
      type: String,
      default: "",
      trim: true,

    },

    basePrice: {
      type: Number,
      required: true,
      min: 0,

    },

    discountPrice: {
      type: Number,
      default: 0,
      min: 0,

    },

    discountPercentage: {
      type: Number,
      default: 0,

    },

    gst: {
      type: Number,
      default: 5,

    },

    preparationTime: {
      type: Number,
      default: 15,

    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,

    },

    totalRatings: {
      type: Number,
      default: 0,

    },

    totalOrders: {
      type: Number,
      default: 0,

    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true
    },

    isRecommended: {
      type: Boolean,
      default: false,

    },

    isDeleted: {
      type: Boolean,
      default: false,

    },

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,

  }
);
foodSchema.index({ restaurant: 1, category: 1 });
foodSchema.index({ restaurant: 1, isAvailable: 1 });
foodSchema.index({ restaurant: 1, isDeleted: 1 });

foodSchema.index({
  itemName: "text",
  description: "text",
});

module.exports = mongoose.model("Food", foodSchema);

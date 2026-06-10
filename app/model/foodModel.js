const { default: mongoose } = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    category: String,
    description: String,
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "restaurant",
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Food", foodSchema);

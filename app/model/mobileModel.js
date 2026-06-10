const mongoose = require("mongoose");
const MobileSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },

    verificationSid: {
      type: String,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("mobile", MobileSchema);

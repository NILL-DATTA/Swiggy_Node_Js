
require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.log(
        "⚠️ No MONGO_URI found in .env — please check Render environment variables.",
      );
      return;
    }
    await mongoose.connect(uri);

    console.log("MongoDb Connected");
  } catch (err) {
    console.log("MongoDB connection failed", err);
  }
};

module.exports = connectDB;
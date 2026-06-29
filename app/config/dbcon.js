const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected ✔");

    console.log("State:", mongoose.connection.readyState); 
    // 1 = connected
  } catch (err) {
    console.log("MongoDB Connection Failed ❌", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
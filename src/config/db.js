const mongoose = require("mongoose");
require("dotenv").config();

const URI = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    if (!URI) {
      throw new Error("MONGO_URI is not defined in .env");
    }
    await mongoose.connect(URI);
    console.log("Connected to MongoDB with mongoose!");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};

module.exports = connectDB;

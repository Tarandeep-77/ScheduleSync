import mongoose from "mongoose";

const connectDB = async () => {
    console.log("Connecting to mongodb...")
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/scheduleSync", {
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
  }
};

export default connectDB
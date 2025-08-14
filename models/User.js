import mongoose from "mongoose";
import lectureSchema from "./Lectures.js"

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["teacher", "admin"], default: "teacher" },
  lectures: [lectureSchema],
  profilePic: String,
});

const User = mongoose.model("User", userSchema);

export default User;

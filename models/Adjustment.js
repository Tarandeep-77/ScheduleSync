import mongoose from "mongoose";

const adjustmentSchema = new mongoose.Schema({
  teacherName: String,
  teacherEmail: String,
  date: String,
  reason: String,
  subject: String,
  room: String,
  startTime: String,
  endTime: String,
  status: { type: String, default: "pending" },
  assignedTo: String,
  response: { type: String, default: "pending" },  
  reason: { type: String, default: "" },
}, { timestamps: true });

const Adjustment = mongoose.model("Adjustment", adjustmentSchema);

export default Adjustment;

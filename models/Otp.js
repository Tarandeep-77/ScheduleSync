import mongoose from "mongoose"

const otpSchema = new mongoose.Schema({
    email:{ type: String,required: true},
    otp:{ type: String, require: true},
    expiresAt:{type: Date, required: true}
})

otpSchema.index({expiresAt:1},{expireAfterSeconds:0});

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;
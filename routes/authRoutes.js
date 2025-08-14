import express from "express";
import { signupUser, loginUser, getAllTeacherEmails,forgotPassword, verifyOtp, resetPassword } from "../controllers/authController.js";
import upload from "../middlewares/uploadMiddleware.js"


const router = express.Router();

router.post("/signup", upload.single("profilePic"),signupUser);
router.post("/login", loginUser);
router.get("/teachers", getAllTeacherEmails);
router.post("/forgot-password",forgotPassword);
router.post("/verify-otp",verifyOtp);
router.post("/reset-password",resetPassword);
export default router;
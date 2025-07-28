import express from "express";
import { signupUser, loginUser, getAllTeacherEmails } from "../controllers/authController.js";
import upload from "../middlewares/uploadMiddleware.js"
const router = express.Router();

router.post("/signup", upload.single("profilePic"),signupUser);
router.post("/login", loginUser);
router.get("/teachers", getAllTeacherEmails);

export default router;

import { Router } from "express";
import {
  getAllLectures,
  getLecturesByEmail,
  addLecture,
  handleLeaveRequest,
  pendingAdjustments,
  getAvailableTeachers
} from "../controllers/lectureController.js";

const router = Router();

router.get("/all", getAllLectures);
router.get("/:email", getLecturesByEmail);
router.post("/", addLecture);
router.post("/leave-request",handleLeaveRequest)
router.get("/adjustments/pending",pendingAdjustments);
router.get("/available-teachers", getAvailableTeachers);


// router.get("/by/:email", getLecturesByEmail);

export default router;
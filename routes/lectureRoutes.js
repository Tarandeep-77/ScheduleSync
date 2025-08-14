import { Router } from "express";
import {
  getAllLectures,
  getLecturesByEmail,
  addLecture,
  handleLeaveRequest,
  pendingAdjustments,
  getAvailableTeachers,
  sendAdjustmentRequest,
  getAssignedAdjustments,
  respondToAdjustment
} from "../controllers/lectureController.js";

const router = Router();

router.get("/all", getAllLectures);
router.get("/:email", getLecturesByEmail);
router.post("/add-lecture", addLecture);
router.post("/leave-request",handleLeaveRequest)
router.get("/adjustments/pending",pendingAdjustments);
router.post("/available-teachers", getAvailableTeachers);
router.post("/adjustments/send-request",sendAdjustmentRequest);
router.post("/adjustments/assigned",getAssignedAdjustments);
router.post("/adjustments/respond",respondToAdjustment);
// router.get("/by/:email", getLecturesByEmail);

export default router;
import User from "../models/User.js";
import Adjustment from "../models/Adjustment.js";

export const getAllLectures = (req, res) => {
  User.find({ role: "teacher" })
    .then(users => {
      const allLectures = [];
      users.forEach(user => {
        user.lectures.forEach(lec => {
          allLectures.push({ ...lec.toObject(), teacherEmail: user.email });
        });
      });
      res.json(allLectures);
    })
    .catch(err => {
      console.error("Failed to read lectures:", err);
      res.status(500).json({ error: "Internal server error" });
    });
};

export const getLecturesByEmail = (req, res) => {
  const { email } = req.params;

  User.findOne({ email })
    .then(user => {
      if (!user || !user.lectures) return res.json([]);
      res.json(user.lectures);
    })
    .catch(err => {
      console.error("Failed to get lectures by email:", err);
      res.status(500).json({ error: "Internal server error" });
    });
};

export const addLecture = (req, res) => {
  const { teacherEmail, day, date, subject, startTime, endTime, room } = req.body;

  if (!teacherEmail || !subject || !date || !startTime || !endTime || !room || !day) {
    return res.status(400).json({ error: "Missing fields" });
  }

  User.findOneAndUpdate(
    { email: teacherEmail, role: "teacher" },
    { $push: { lectures: { day, date, subject, startTime, endTime, room } } },
    { new: true }
  )
    .then(user => {
      if (!user) return res.status(404).json({ error: "Teacher not found" });
      res.json({ message: "Lecture saved successfully" });
    })
    .catch(err => {
      console.error("Failed to save lecture:", err);
      res.status(500).json({ error: "Internal server error" });
    });
};

export const handleLeaveRequest = (req, res) => {
  const user = req.session.user;
  if (!user || !user.email) return res.status(401).send("Unauthorized");

  const { date, reason } = req.body;

  User.findOne({ email: user.email })
    .then(teacher => {
      if (!teacher || !teacher.lectures) {
        return res.send("No lectures found for this teacher.");
      }

      const sameDayLectures = teacher.lectures.filter(lec => lec.date === date);
      const adjustmentsToInsert = [];

      const checkPromises = sameDayLectures.map(lec => {
        return Adjustment.findOne({
          teacherEmail: user.email,
          date: lec.date,
          startTime: lec.startTime,
          endTime: lec.endTime,
          subject: lec.subject,
          room: lec.room
        }).then(exists => {
          if (!exists) {
           adjustmentsToInsert.push({
           teacherName: user.name,
           teacherEmail: user.email,
           date,
           day: new Date(date).toLocaleDateString("en-US", { weekday: "long" }),
           reason,
           subject: lec.subject,
           room: lec.room,
           startTime: lec.startTime,
           endTime: lec.endTime,
           status: "pending"
          });
          }
        });
      });

      return Promise.all(checkPromises).then(() => {
        if (adjustmentsToInsert.length) {
          return Adjustment.insertMany(adjustmentsToInsert);
        }
      });
    })
    .then(() => {
      res.json({ message: "Leave request submitted successfully!" });
    })
    .catch(err => {
      console.error("Error handling leave:", err);
      res.status(500).send("Internal server error");
    });
};


export const pendingAdjustments = (req, res) => {
  Adjustment.find({ status: "pending" })
    .then(pending => res.json(pending))
    .catch(err => {
      console.error("Failed to fetch pending adjustments:", err);
      res.status(500).send({ error: "Internal server error" });
    });
};

export const getAvailableTeachers = (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing adjustment ID" });

  Adjustment.findById(id)
    .then(adjustment => {
      if (!adjustment) return res.status(404).json({ error: "Adjustment not found" });

      const { date, startTime, endTime, subject } = adjustment;

      User.find({ role: "teacher" })
        .then(teachers => {
          const available = teachers
            .filter(teacher => {
              const isAvailable = !teacher.lectures.some(lec =>
                lec.date === date && lec.startTime === startTime
              );
              const teachesSameSubject = teacher.lectures.some(lec => lec.subject === subject);

              return isAvailable && teachesSameSubject;
            })
            .map(t => {
              const lectureCount = t.lectures.filter(l => l.date === date).length;
              return { email: t.email, lectureCount };
            });

          res.json(available);
        })
        .catch(err => {
          console.error("Error fetching teachers:", err);
          res.status(500).json({ error: "Internal server error" });
        });
    })
    .catch(err => {
      console.error("Error fetching adjustment:", err);
      res.status(500).json({ error: "Internal server error" });
    });
};

export const sendAdjustmentRequest = (req, res) => {
  const { adjustmentId, assignedTeacherEmail } = req.body;

  if (!adjustmentId || !assignedTeacherEmail) {
    return res.status(400).json({ message: "Missing data" });
  }

  Adjustment.findByIdAndUpdate(adjustmentId, {
    assignedTo: assignedTeacherEmail,
    response: "pending"
  }, { new: true })
    .then(updated => {
      if (!updated) return res.status(404).json({ message: "Adjustment not found" });
      res.json({ message: `Request sent to ${assignedTeacherEmail}` });
    })
    .catch(err => {
      console.error("Failed to send adjustment request:", err);
      res.status(500).json({ message: "Internal server error" });
    });
};

export const getAssignedAdjustments = (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });

  Adjustment.find({ assignedTo: email, response: "pending" })
    .then(requests => res.json(requests))
    .catch(err => {
      console.error("Failed to fetch assigned adjustments:", err);
      res.status(500).json({ error: "Internal server error" });
    });
};

export const respondToAdjustment = (req, res) => {
  const { id, action, reason, teacherEmail } = req.body;

  Adjustment.findById(id)
    .then(async adjustment => {
      if (!adjustment) {
        return res.status(404).json({ error: "Request not found" });
      }

      if (action === "accept") {
        // Prevent duplicate lecture
        const existingLecture = await User.findOne({
          email: teacherEmail,
          role: "teacher",
          "lectures.date": adjustment.date,
          "lectures.startTime": adjustment.startTime
        });

        if (!existingLecture) {
          // Ensure day exists
          let lectureDay = adjustment.day;
          if (!lectureDay && adjustment.date) {
            const dateObj = new Date(adjustment.date);
            lectureDay = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
          }

          await User.findOneAndUpdate(
            { email: teacherEmail, role: "teacher" },
            {
              $push: {
                lectures: {
                  day: lectureDay,
                  date: adjustment.date,
                  subject: adjustment.subject,
                  startTime: adjustment.startTime,
                  endTime: adjustment.endTime,
                  room: adjustment.room
                }
              }
            },
             { new: true, runValidators: true }  
          );
        }

        adjustment.status = "approved";
        await adjustment.save();
        return res.json({ success: true, message: "Lecture added and request approved" });

      } else if (action === "reject") {
        adjustment.status = "rejected";
        adjustment.reason = reason || "No reason provided";
        await adjustment.save();
        return res.json({ success: true, message: "Request rejected" });

      } else {
        return res.status(400).json({ error: "Invalid action" });
      }
    })
    .catch(err => {
      console.error("Adjustment respond error:", err);
      res.status(500).json({ error: "Server error" });
    });
};
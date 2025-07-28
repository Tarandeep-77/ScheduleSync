import fs, { write } from "fs";
import path from "path";

const dataFilePath = path.join(process.cwd(), "data.json");

function readUsers(){
  return new Promise((resolve,reject)=>{
    fs.readFile(dataFilePath,"utf-8",(err,data)=>{
      if(err){
        if(err.code === "ENOENT") return resolve([]);
        return reject(err)
      }
      try{
        const users = JSON.parse(data)
        resolve(users)
      }catch(parseErr){
        reject(parseErr)
      }
    });
  });
}
function writeUsers(users) {
  return new Promise((resolve,reject)=>{
    fs.writeFile(dataFilePath,JSON.stringify(users,null,2),err=>{
      if(err) return reject(err);
      resolve()
    });
  });
}

function readAdjustments(){
  return new Promise((resolve,reject)=>{
    fs.readFile(adjustmentPath,"utf-8",(err,data)=>{
       if (err) {
        if (err.code === "ENOENT") return resolve([]);
        return reject(err);
      }
      try {
        const adjustments = JSON.parse(data);
        resolve(adjustments);
      } catch (e) {
        reject(e);
      }
    })
  })
}

function writeAdjustments(data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(adjustmentPath, JSON.stringify(data, null, 2), err => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export const getAllLectures = (req, res) => {
    readUsers()
    .then(users=>{
    let allLectures = [];

    users.forEach(user => {
      if (user.role === "teacher" && Array.isArray(user.lectures)) {
        user.lectures.forEach(lec => {
          allLectures.push({ ...lec, teacherEmail: user.email });
        });
      }
    });

    res.json(allLectures);
  })
  .catch(err=>{
    console.log("Failed to read lectures: ",err);
    res.status(500).json({error : "Internal server error"})
  })
};

export const getLecturesByEmail = (req, res) => {
  const { email } = req.params;

    readUsers()
    .then(users=>{
    const user = users.find(u => u.email === email);

    if (!user || !user.lectures) {
      return res.json([]);
    }

    res.json(user.lectures);
  })
  .catch(err=> {
    console.error("Failed to get lectures by email:", err);
    res.status(500).json({ error: "Internal server error" });
  });
};

export const addLecture = (req, res) => {
  const { teacherEmail, day, date, subject, startTime, endTime, room } = req.body;

  if (!teacherEmail || !subject || !date || !startTime || !endTime || !room || !day) {
    return res.status(400).json({ error: "Missing fields" });
  }

  
    readUsers()
    .then(users=>{
    const teacher = users.find(u => u.email === teacherEmail && u.role === "teacher");

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    const newLecture = { subject, day, date, startTime, endTime, room };
    teacher.lectures.push(newLecture);

    writeUsers(users);
    res.json({ message: "Lecture saved successfully" });
  })
  .catch (err=> {
    console.error("Failed to save lecture:", err);
    res.status(500).json({ error: "Internal server error" });
  })
};

// const dataPath = path.join(process.cwd(), "data.json");
const adjustmentPath = path.join(process.cwd(), "adjustments.json");

export const handleLeaveRequest = (req, res) => {
  const user = req.session.user;

  if (!user || !user.email) {
    return res.status(401).send("Unauthorized: No user in session");
  }

  const { date, reason } = req.body;

  Promise.all([readUsers(), readAdjustments()])
    .then(([users, adjustments]) => {

  const userData = users.find(u => u.email === user.email);
  if (!userData || !userData.lectures) {
    return res.send("No lectures found for this teacher.");
  }

  const sameDayLectures = userData.lectures.filter(l => l.date === date);

  sameDayLectures.forEach(lec => {
    const alreadyExists = adjustments.some(adj =>
      adj.teacherEmail === user.email &&
      adj.date === lec.date &&
      adj.startTime === lec.startTime &&
      adj.endTime === lec.endTime &&
      adj.subject === lec.subject &&
      adj.room === lec.room
    );

    if (!alreadyExists) {
      adjustments.push({
        id: Date.now() + Math.random(),
        teacherName: user.name,
        teacherEmail: user.email,
        date,
        reason,
        subject: lec.subject,
        room: lec.room,
        startTime: lec.startTime,
        endTime: lec.endTime,
        status: "pending"
      });
    }
  });
  return writeAdjustments(adjustments)
})
.then(()=>{
  res.redirect("/teacher")
})
  .catch(err=>{
    console.log("Error handling leave:", err)
    res.status(500).send("Internal server error")
  })
};


export const pendingAdjustments = (req, res) => {
  readAdjustments()
  .then(adjustments=>{
  const pending = adjustments.filter(adj => adj.status === "pending");
  res.json(pending);
  })
  .catch(err=>{
    console.log("Failed to fetch pending adjustments:",err)
    res.status(500).send({error : "Internal server error"})
  })
};

export const getAvailableTeachers = (req, res) => {
  Promise.all([readUsers(), readAdjustments()])
    .then(([users, adjustments]) => {
      const pendingAdjustment = adjustments.find(adj => adj.status === "pending");

      if (!pendingAdjustment) {
        return res.status(404).json({ error: "No pending adjustments found" });
      }

      const { date, startTime, endTime } = pendingAdjustment;
      const teachers = users.filter(user => user.role === "teacher");

      const availableTeachers = [];

      teachers.forEach(teacher => {
        const lectures = teacher.lectures || [];

        const sameDayLectures = lectures.filter(lec => lec.date === date);

        const isClashing = sameDayLectures.some(lec => {
          return (
            (startTime < lec.endTime && endTime > lec.startTime)
          );
        });

        if (!isClashing) {
          availableTeachers.push({
            name: teacher.name,
            email: teacher.email,
            lectureCount: sameDayLectures.length
          });
        }
      });

      res.status(200).json(availableTeachers);
    })
    .catch(err => {
      console.error("Error fetching available teachers:", err);
      res.status(500).json({ error: "Server error" });
    });
};

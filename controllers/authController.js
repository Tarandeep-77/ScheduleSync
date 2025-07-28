// import { rejects } from "assert";
import fs from "fs";
// import { resolve } from "path";

const dataFile = "./data.json";

function readUsers(){
  return new Promise((resolve,reject)=>{
    fs.readFile(dataFile,"utf-8",(err,data)=>{

      if(err){
        if(err.code === "ENOENT") return resolve([])
          return reject(err)
      }
      try{
        const users = JSON.parse(data)
        resolve(users)
      }
      catch(parseErr){
        reject(parseErr)
      }
    })
  })
}
function writeUsers(users) {
  return new Promise((resolve,reject)=>{
   fs.writeFile(dataFile,JSON.stringify(users,null,2),(err)=>{
    if(err) return reject(err);
    resolve()
   })
  })
}

export const signupUser = (req, res) => {

  const { name, email, password, role } = req.body;
  readUsers()
  .then(users=>{
  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    return res.json({ message: "User already exists" });
  }

  let finalRole = "teacher";
  if (email === "taran123@gmail.com" && role === "admin") {
    finalRole = "admin";
  } else if (role === "admin") {
    return res.json({ message: "You are not allowed to signup as admin" });
  }

  const newUser = {
    name,
    email,
    password,
    role: finalRole,
    lectures: [],
    profilePic: req.file? req.file.filename : null
  };
  users.push(newUser);

  writeUsers(users)
  .then(()=>{
    res.json({ message: `User registered as ${finalRole}` });
  })
})
  .catch(err=>{
    console.log("Read error:",err)
    res.status(500).json({message : "Error reading user data"})
  })
};

export const loginUser = (req, res) => {
  const { email, password } = req.body;
  readUsers()
  .then(users=>{

  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  req.session.user = {
    name: user.name,
    email: user.email,
    role: user.role,
    profilePic: user.profilePic
  };

  req.session.save(err => {
    if (err) {
      console.error("Session save error:", err);
      return res.status(500).json({ message: "Session error" });
    }
  return res.json({
    success: true,
    user: req.session.user
  });
  });
})
.catch(err=>{
  console.log("Login error:",err)
  res.status(500).json({message : "Error reading user data"})
})
};

export const getAllTeacherEmails = (req, res) => {
  readUsers()
  .then(users=>{
  const teacherEmails = users
    .filter(user => user.role === "teacher")
    .map(user => user.email);
  res.json(teacherEmails);
  })
  .catch(err=>{
    console.log("Error fetching teacher emails:",err)
    res.status(500).json({message : "Failed to fetch teacher emails"})
  })
};

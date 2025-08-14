import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import authRoutes from "./routes/authRoutes.js";
import lectureRoutes from "./routes/lectureRoutes.js";
import { isAuthenticated, isAdmin, isTeacher } from "./middlewares/authMiddleware.js";
import connectDB from "./config/db.js";

const app = express();
const PORT = 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
connectDB();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true })); 
app.use("/uploads", express.static("uploads")); 
app.set('view engine','ejs');
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret: "re63grduieeguqw82hdh",
    resave: false,
    saveUninitialized: false,
    cookie:{
      maxAge: 4*60*60*1000
    }
  })
);

app.use("/auth", authRoutes);
app.use("/api/lectures", lectureRoutes);
app.get("/",(req,res)=>{
  res.render("login")
})
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/admin", isAuthenticated, isAdmin, (req, res) => {
   const user = req.session.user;
  res.render("admin", {user});
});

app.get("/teacher", isAuthenticated, isTeacher, (req, res) => {
  const user = req.session.user;
  console.log(user);
  res.render("teacher", {user});
});
app.get("/check-session", (req, res) => {
  if (req.session && req.session.user) {
    res.json({ active: true });
  } else {
    res.json({ active: false });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

import User from "../models/User.js";
import bcrypt from "bcrypt";
import Otp from "../models/Otp.js";
import { sendOtpEmail } from "../utils/mailer.js";


const SALT_ROUNDS = 8;
export const signupUser = (req, res) => {
  const { name, email, password, role } = req.body;

  User.findOne({ email })
    .then(existingUser => {
      if (existingUser) {
        return res.json({ message: "User already exists" });
      }

      let finalRole = "teacher";
      if (email === "taran123@gmail.com" && role === "admin") {
        finalRole = "admin";
      } else if (role === "admin") {
        return res.json({ message: "You are not allowed to signup as admin" });
      }

      const newUser = new User({
        name,
        email,
        password,
        role: finalRole,
        lectures: [],
        profilePic: req.file ? req.file.filename : null
      });

      return newUser.save();
    })
    .then(savedUser => {
      if (savedUser) {
        res.json({ message: `User registered successfully` });
      }
    })
    .catch(err => {
      console.error("Signup error:", err);
      res.status(500).json({ message: "Server error" });
    });
};

export const loginUser = (req, res) => {
  const { email, password } = req.body;

  User.findOne({ email, password })
    .then(user => {
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
        return res.json({ success: true, user: req.session.user });
      });
    })
    .catch(err => {
      console.error("Login error:", err);
      res.status(500).json({ message: "Server error" });
    });
};

export const getAllTeacherEmails = (req, res) => {
  User.find({ role: "teacher" }, "email")
    .then(teachers => {
      const emails = teachers.map(t => t.email);
      res.json(emails);
    })
    .catch(err => {
      console.error("Error fetching teacher emails:", err);
      res.status(500).json({ message: "Failed to fetch teacher emails" });
    });
};
  
export const forgotPassword = (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    let otpCode;
    User.findOne({ email })
        .then(user => {
            if (!user) {
                return Promise.reject({ status: 404, message: "User not found" });
            }
          
            return Otp.deleteMany({ email });
        })
        .then(() => {
            
            otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
            return bcrypt.hash(otpCode, SALT_ROUNDS);
        })
        .then(hashedOtp => {

            return Otp.create({
                email,
                otp: hashedOtp,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 min 
            });
        })
        .then(() => {
            return sendOtpEmail(email, otpCode);
        })
        .then(() => {
            res.json({ message: "OTP sent to your email" });
        })
        .catch(err => {
            console.error("Forgot password error:", err);
            if (err.status) {
                res.status(err.status).json({ message: err.message });
            } else {
                res.status(500).json({ message: "Server error" });
            }
        });
};

export const verifyOtp = (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    Otp.findOne({ email })
        .then(otpRecord => {
            if (!otpRecord) {
                return Promise.reject({ status: 400, message: 'Invalid or expired OTP' });
            }
            return bcrypt.compare(otp, otpRecord.otp)
                .then(isMatch => {
                    if (!isMatch) {
                        return Promise.reject({ status: 400, message: 'Invalid OTP' });
                    }
                    if (otpRecord.expiresAt < new Date()) {
                        return Promise.reject({ status: 400, message: 'OTP expired' });
                    }
                    return Promise.resolve();
                });
        })
        .then(() => {
            res.json({ message: 'OTP verified successfully' });
        })
        .catch(err => {
            console.error('Verify OTP error:', err);
            if (err.status) {
                res.status(err.status).json({ message: err.message });
            } else {
                res.status(500).json({ message: 'Server error' });
            }
        });
};

export const resetPassword = (req, res) => {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    Otp.findOne({ email })
        .then(otpRecord => {
            if (!otpRecord) {
                return Promise.reject({ status: 400, message: 'Invalid or expired OTP' });
            }
            return bcrypt.compare(otp, otpRecord.otp)
                .then(isMatch => {
                    if (!isMatch) {
                        return Promise.reject({ status: 400, message: 'Invalid OTP' });
                    }
                    if (otpRecord.expiresAt < new Date()) {
                        return Promise.reject({ status: 400, message: 'OTP expired' });
                    }
                    return bcrypt.hash(newPassword, SALT_ROUNDS);
                });
        })
        .then(hashedPassword => {
            return User.updateOne({ email }, { password: hashedPassword });
        })
        .then(() => {
            return Otp.deleteOne({ email });
        })
        .then(() => {
            res.json({ message: 'Password reset successful' });
        })
        .catch(err => {
            console.error('Reset password error:', err);
            if (err.status) {
                res.status(err.status).json({ message: err.message });
            } else {
                res.status(500).json({ message: 'Server error' });
            }
        });
};

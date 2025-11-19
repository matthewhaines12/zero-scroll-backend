const express = require("express");
const User = require("../models/User");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

const CLIENT_URL = process.env.CLIENT_URL;
const JWT_ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
const JWT_REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;
const JWT_EMAIL_SECRET = process.env.EMAIL_TOKEN_SECRET;

const isValidPassword = (password) => {
  if (password.length < 10) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^a-zA-Z0-9]/.test(password)) return false;
  return true;
};

router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Please provide an email and password" });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        error:
          "Password must be at least 10 characters, contain one uppercase letter, one lowercase letter, one number, and one special character",
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ error: "Email id already registerd" });
    }

    const hashedPassword = await bcrypt.hash(password, 11); // hash password

    const newUser = await User.insertOne({
      email,
      password: hashedPassword,
    });
    await newUser.save();

    // Generate email JWT for verification:
    emailToken = jwt.sign({ userID: newUser._id }, JWT_EMAIL_SECRET, {
      expiresIn: "10m",
    });
    verifyURL = `${CLIENT_URL}/verify-email?token=${emailToken}`;
    await sendEmail({
      to: newUser.email,
      subject: "Verify your Zero Scroll account",
      html: `<p>Please click the link below to verify your email:</p>
           <a href="${verifyURL}">${verifyURL}</a>`,
    });

    res.status(200).json({
      message:
        "New user created successfully, please verify your email to login",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Please provide an email and password" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (user.verified == false) {
      return res
        .status(403)
        .json({ error: "Please verify your email before logging in" });
    }

    // Generate JWT's
    const accessToken = jwt.sign({ userID: user._id }, JWT_ACCESS_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ userID: user._id }, JWT_REFRESH_SECRET, {
      expiresIn: "30d",
    });

    const userObj = user.toObject();
    delete userObj.password;

    // Refresh token stored in HTTP only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    });

    res.status(200).json({ message: "Successful login", userObj, accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/logout", (req, res) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    });
    res.status(200).json({ message: "Successful logout" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/verify-email", async (req, res) => {
  try {
    const emailToken = req.query.token;
    if (!emailToken) {
      return res
        .status(400)
        .json({ error: "Missing email verification token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(emailToken, JWT_EMAIL_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ error: "Invalid or expired refresh token" });
    }
    const user = await User.findById(decoded.userID);

    if (!user) {
      return res.status(404).json({ error: "User doesn't exist" });
    }

    await User.findByIdAndUpdate(
      decoded.userID,
      { verified: true },
      { new: true } // returns updated User
    );

    res.status(200).json({ message: "Successful user verification" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(404).json({ error: "No refresh token available" });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ error: "Invalid or expired refresh token" });
    }

    const user = await User.findById(decoded.userID);

    if (!user) {
      return res.status(404).json({ error: "User doesn't exist" });
    }

    if (!user.verified) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      });
      return res.status(403).json({
        error: "Email verification required",
      });
    }

    const newAccessToken = jwt.sign({ userID: user._id }, JWT_ACCESS_SECRET, {
      expiresIn: "15m",
    });
    const newRefreshToken = jwt.sign({ userID: user._id }, JWT_REFRESH_SECRET, {
      expiresIn: "30d",
    });

    // Refresh token stored in HTTP only cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    });

    res.status(200).json({ message: "Tokens refreshed", user, newAccessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

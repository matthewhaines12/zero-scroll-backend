import User from '../models/User.js';
import Task from '../models/Task.js';
import Session from '../models/Session.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sendEmail from '../utils/sendEmail.js';

const CLIENT_URL = process.env.CLIENT_URL;
const JWT_ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
const JWT_REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;
const JWT_EMAIL_SECRET = process.env.EMAIL_TOKEN_SECRET;
const JWT_RESET_SECRET = process.env.RESET_TOKEN_SECRET;

const isValidPassword = (password) => {
  if (password.length < 10) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^a-zA-Z0-9]/.test(password)) return false;
  return true;
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const signup = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res
        .status(400)
        .json({ error: 'Please provide an email, password, and username' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        error:
          'Password must be at least 10 characters, contain one uppercase letter, one lowercase letter, one number, and one special character',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email form',
      });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      if (userExists.email === email) {
        return res.status(400).json({ error: 'Email is already registerd' });
      }
      if (userExists.username === username) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 11);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const emailToken = jwt.sign({ userID: user._id }, JWT_EMAIL_SECRET, {
      expiresIn: '10m',
    });

    const verifyURL = `${CLIENT_URL}verify-email?token=${emailToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Verify your Zero Scroll account',
      html: `<p>Hi ${user.username}, please click the link below to verify your email:</p>
             <a href="${verifyURL}">${verifyURL}</a>`,
    });

    res.status(201).json({
      message:
        'New user created successfully, please verify your email to login',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 'Please provide an email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (!user.verified) {
      return res
        .status(403)
        .json({ error: 'Please verify your email before logging in' });
    }

    const accessToken = jwt.sign({ userID: user._id }, JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign({ userID: user._id }, JWT_REFRESH_SECRET, {
      expiresIn: '30d',
    });

    const userObj = user.toObject();
    delete userObj.password;

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    res.status(200).json({ message: 'Successful login', userObj, accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const logout = (req, res) => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    });
    res.status(200).json({ message: 'Successful logout' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const emailToken = req.query.token;
    if (!emailToken) {
      return res
        .status(400)
        .json({ error: 'Missing email verification token' });
    }

    let decoded;
    try {
      decoded = jwt.verify(emailToken, JWT_EMAIL_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ error: 'Invalid or expired email verification token' });
    }

    const user = await User.findByIdAndUpdate(
      decoded.userID,
      { verified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User doesn't exist" });
    }

    res.status(200).json({ message: 'Successful user verification' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Please provide an email to send the verification url',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User doesn't exist" });
    }

    if (user.verified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    const emailToken = jwt.sign({ userID: user._id }, JWT_EMAIL_SECRET, {
      expiresIn: '10m',
    });

    const verifyURL = `${CLIENT_URL}verify-email?token=${emailToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Verify your Zero Scroll account',
      html: `<p>Hi ${user.username}, please click the link below to verify your email:</p>
             <a href="${verifyURL}">${verifyURL}</a>`,
    });

    res.status(200).json({ message: 'Verification email resent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(404).json({ error: 'No refresh token available' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ error: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.userID);

    if (!user) {
      return res.status(404).json({ error: "User doesn't exist" });
    }

    if (!user.verified) {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      });
      return res.status(403).json({ error: 'Email verification required' });
    }

    const newAccessToken = jwt.sign({ userID: user._id }, JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });

    const newRefreshToken = jwt.sign({ userID: user._id }, JWT_REFRESH_SECRET, {
      expiresIn: '30d',
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    res.status(200).json({ message: 'Tokens refreshed', user, newAccessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(404).json({ error: 'Email missing' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        message:
          "If that email is registered, you'll receive a password reset link",
      });
    }

    const resetToken = jwt.sign({ userID: user._id }, JWT_RESET_SECRET, {
      expiresIn: '10m',
    });

    const resetURL = `${CLIENT_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Reset your Scroll Zero password',
      html: `<p>Hi ${user.name}, please click the link below to reset your password:</p>
             <a href="${resetURL}">${resetURL}</a>`,
    });

    res.status(200).json({
      message: "If that email is registerd, you'll receive an email",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ error: 'Token and new password are required' });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        error:
          'Password must be at least 10 characters, contain one uppercase letter, one lowercase letter, one number, and one special character',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_RESET_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 11);

    const user = await User.findByIdAndUpdate(
      decoded.userID,
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userID = req.userID;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userID).select('+password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        error:
          'Password must be at least 10 characters, contain one uppercase letter, one lowercase letter, one number, and one special character',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 11);

    await User.findByIdAndUpdate(
      userID,
      { password: hashedPassword },
      { new: true }
    );

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    });

    res.status(200).json({ message: 'Successful password change' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userID = req.userID;

    await Task.deleteMany({ userID });
    await Session.deleteMany({ userID });
    await User.findByIdAndDelete(userID);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    });

    res.status(200).json({ message: 'Successful account deletion' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// User Settings and Preferences
export const getSettings = async (req, res) => {
  try {
    const userID = req.userID;

    const user = await User.findById(userID).select(
      'timerSettings preferences'
    );

    res.status(200).json({
      timerSettings: user.timerSettings,
      preferences: user.preferences,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateTimerSettings = async (req, res) => {
  try {
    const userID = req.userID;
    const updates = req.body;

    const user = await User.findByIdAndUpdate(
      userID,
      { $set: { timerSettings: updates } },
      { new: true, runValidators: true }
    ).select('timerSettings');

    res.status(200).json({
      timerSettings: user.timerSettings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const userID = req.userID;
    const updates = req.body;

    const updateObj = {}; // Update partial preferences
    for (const [key, value] of Object.entries(updates)) {
      updateObj[`preferences.${key}`] = value;
    }

    const user = await User.findByIdAndUpdate(
      userID,
      { $set: updateObj },
      { new: true, runValidators: true }
    ).select('preferences');

    res.status(200).json({
      preferences: user.preferences,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

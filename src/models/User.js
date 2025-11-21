import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true, trim: true },
    password: { type: String, required: true, select: false },
    verified: { type: Boolean, default: false },
    timerSettings: {
      focusMinutes: { type: Number, default: 50 },
      breakMinutes: { type: Number, default: 10 },
      longBreakMinutes: { type: Number, default: 20 },
      intervalsPerSession: { type: Number, default: 3 }, // ex: 50/10 x3
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);

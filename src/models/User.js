import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, unique: true, required: true, trim: true },
    password: { type: String, required: true, select: false },
    verified: { type: Boolean, default: false },
    lastLogin: { type: Date, default: Date.now },
    timerSettings: {
      FOCUS: {
        value: { type: Number, min: 1, max: 99, default: 25 },
        unit: { type: String, default: 'mins' },
      },
      BREAK: {
        value: { type: Number, min: 1, max: 99, default: 5 },
        unit: { type: String, default: 'mins' },
      },
      RECOVER: {
        value: { type: Number, min: 1, max: 99, default: 30 },
        unit: { type: String, default: 'mins' },
      },
      REPEAT: {
        value: { type: Number, min: 1, max: 10, default: 3 },
        unit: { type: String, default: 'times' },
      },
    },
    preferences: {
      playSoundEffects: { type: Boolean, default: true },
      autoStartTimer: { type: Boolean, default: true },
      dailyGoal: { type: Number, default: 8, min: 1, max: 25 },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('User', userSchema);

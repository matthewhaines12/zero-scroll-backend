import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sessionType: {
      type: String,
      enum: ['FOCUS', 'BREAK', 'RECOVER'],
      required: true,
    },
    plannedDuration: { type: Number, required: true },
    actualDuration: { type: Number, default: null },
    startTime: { type: Date, default: Date.now(), required: true },
    endTime: { type: Date, default: null },
    countsTowardStats: { type: Boolean, default: false },
    completed: { type: Boolean, default: false }, // True if finished naturally, false if ended early
  },
  { timestamps: true }
);

export default mongoose.model('Session', sessionSchema);

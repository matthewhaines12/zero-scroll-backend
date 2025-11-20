import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Session belongs to which User
    taskID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    }, // Session belongs to which Task
    completed: { type: Boolean, default: false },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: { type: Number, default: 0 }, // start time - end time
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("Session", sessionSchema);

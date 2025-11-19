const mongoose = require("mongoose");

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
    duration: { type: Number }, // start time - end time
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Session", sessionSchema);

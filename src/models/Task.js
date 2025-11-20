import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Task belongs to which user
    title: { type: String, required: true },
    estimatedTime: { type: Number },
    category: { type: String }, // deep work or shallow work
    tags: [String], // i.e., coding, studying, etc - for sorting
    completed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("Task", taskSchema);

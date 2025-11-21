import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    scheduledFor: { type: Date },
    category: { type: String }, // deep work or shallow work
    tags: [String],
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);

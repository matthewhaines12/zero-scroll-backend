import Session from "../models/Session.js";
import Task from "../models/Task.js";

export const startSession = async (req, res) => {
  try {
    const userID = req.userID;
    const { taskID } = req.body;

    if (!taskID) {
      return res.status(404).json({ error: "taskID required" });
    }

    const task = await Task.findOne({ _id: taskID, userID });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // check for active sessions
    const session = await Session.create({
      userID,
      taskID,
      startTime: Date.now(),
    });

    res.status(201).json({ message: "Session started", session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getSessions = async (req, res) => {
  try {
    const userID = req.userID;

    const sessions = await Session.find({ userID })
      .sort({ startTime: -1 })
      .populate("taskID", "title category");

    res
      .status(200)
      .json({ message: "Sessions returned successfully", sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const stopSession = async (req, res) => {
  try {
    const userID = req.userID;
    const sessionID = req.params.id;

    if (!sessionID) {
      return res.status(404).json({ error: "Missing sessionID" });
    }

    const session = await Session.findOne({ _id: sessionID, userID });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.completed) {
      return res.status(400).json({ message: "Session already completed" });
    }

    session.completed = true;
    session.endTime = Date.now();
    session.duration = (session.endTime - session.startTime) / 1000 / 60;

    await session.save();

    res
      .status(200)
      .json({ message: "Session completed successfully", session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getSession = async (req, res) => {
  try {
    const userID = req.userID;
    const sessionID = req.params.id;

    if (!sessionID) {
      return res.status(404).json({ error: "sessionID required" });
    }

    const session = await Session.findOne({ _id: sessionID, userID });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.status(200).json({ message: "Session returned successfully", session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const userID = req.userID;
    const sessionID = req.params.id;

    if (!sessionID) {
      return res.status(404).json({ error: "sessionID required" });
    }

    const session = await Session.findOneAndDelete({ _id: sessionID, userID });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.status(200).json({ message: "Session deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getTodaysSessions = async (req, res) => {
  try {
    const userID = req.userID;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const todaysSessions = await Session.find({
      userID,
      completed: true,
      endTime: { $gte: start, $lte: end },
    }).sort({
      startTime: 1, // earliest first
    });

    res.status(200).json({
      message: "Today's sessions returned successfully",
      todaysSessions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getSessionsForTasks = async (req, res) => {
  try {
    const userID = req.userID;
    const taskID = req.params.id;

    if (!taskID) {
      return res.status(404).json({ error: "taskID required" });
    }

    const task = await Task.findOne({ _id: taskID, userID });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const sessionsForTask = await Session.find({
      userID,
      taskID,
    }).sort({ startTime: -1 });

    res.status(200).json({
      message: "Sessions for task returned successfully",
      sessionsForTask,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

import Task from '../models/Task.js';

export const createTask = async (req, res) => {
  try {
    const userID = req.userID;
    const data = req.body; // May want to whitelist certain fields later

    if (!data.title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const task = await Task.create({
      userID,
      title: data.title,
      priority: data.priority,
      // description: data.description || '',
      // scheduledFor: data.scheduledFor || null,
      // category: data.category || null,
      // tags: data.tags || [],
    });

    res.status(201).json({ message: 'New task created successfully', task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getTasks = async (req, res) => {
  try {
    const userID = req.userID;

    const tasks = await Task.find({ userID }).sort({
      createdAt: -1,
    });

    res.status(200).json({ message: 'Tasks returned successfully', tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getTask = async (req, res) => {
  try {
    const userID = req.userID;
    const taskID = req.params.id;

    if (!taskID) {
      return res.status(400).json({ error: 'Missing taskID' });
    }

    const task = await Task.findOne({ _id: taskID, userID });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({ message: 'Task returned successfully', task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateTask = async (req, res) => {
  try {
    const userID = req.userID;
    const taskID = req.params.id;
    const updates = req.body;

    // white list completed, priority, and title later **
    if (!taskID) {
      return res.status(400).json({ error: 'Missing taskID' });
    }

    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskID, userID },
      updates,
      {
        new: true,
      }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res
      .status(200)
      .json({ message: 'Task updated successfully', task: updatedTask });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const userID = req.userID;
    const taskID = req.params.id;

    if (!taskID) {
      return res.status(400).json({ error: 'Missing taskID' });
    }

    const deletedTask = await Task.findOneAndDelete({ _id: taskID, userID });

    if (!deletedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json({ message: 'Task successfully deleted', deletedTask });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getTodaysTasks = async (req, res) => {
  try {
    const userID = req.userID;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const todaysTasks = await Task.find({
      userID,
      completed: false,
      scheduledFor: { $gte: start, $lte: end },
    }).sort({
      scheduledFor: 1, // earliest first
    });

    res
      .status(200)
      .json({ message: "Today's tasks returned successfully", todaysTasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

import Session from '../models/Session.js';

export const startSession = async (req, res) => {
  try {
    const userID = req.userID;
    const { sessionType, plannedDuration } = req.body;

    if (!sessionType || !plannedDuration) {
      return res.status(400).json({ error: 'Session type required' });
    }

    const validSessionTypes = ['FOCUS', 'BREAK', 'RECOVER'];

    if (!validSessionTypes.includes(sessionType)) {
      return res.status(400).json({
        error: 'Invalid sessionType. Must be FOCUS, BREAK, or RECOVER',
      });
    }

    // Create session
    const session = await Session.create({
      userID,
      sessionType,
      plannedDuration,
    });

    res.status(201).json({ message: 'Session started', session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getSessions = async (req, res) => {
  try {
    const userID = req.userID;

    const sessions = await Session.find({ userID }).sort({ startTime: -1 });

    if (!sessions) {
      return res.status(404).json({ error: 'No sessions started' });
    }

    res
      .status(200)
      .json({ message: 'Sessions returned successfully', sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const stopSession = async (req, res) => {
  try {
    const userID = req.userID;
    const sessionID = req.params.id;

    const { actualDuration, completed, countsTowardStats } = req.body;

    if (!sessionID) {
      return res.status(400).json({ error: 'Missing sessionID' });
    }

    if (
      actualDuration === undefined ||
      completed === undefined ||
      countsTowardStats === undefined
    ) {
      return res.status(400).json({
        error: 'Missing actualDuration, completed, and countsTowardStats',
      });
    }

    const session = await Session.findOne({ _id: sessionID, userID });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.completed) {
      return res.status(400).json({ error: 'Session already completed' });
    }

    session.endTime = Date.now();
    session.actualDuration = actualDuration;
    session.completed = completed;
    session.countsTowardStats = countsTowardStats;

    await session.save();

    res
      .status(200)
      .json({ message: 'Session completed successfully', session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getSession = async (req, res) => {
  try {
    const userID = req.userID;
    const sessionID = req.params.id;

    if (!sessionID) {
      return res.status(400).json({ error: 'sessionID required' });
    }

    const session = await Session.findOne({ _id: sessionID, userID });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.status(200).json({ message: 'Session returned successfully', session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const userID = req.userID;
    const sessionID = req.params.id;

    if (!sessionID) {
      return res.status(404).json({ error: 'sessionID required' });
    }

    const session = await Session.findOneAndDelete({ _id: sessionID, userID });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.status(200).json({ message: 'Session deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getTodaysSessions = async (req, res) => {
  try {
    const userID = req.userID;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const sessions = await Session.find({
      userID,
      countsTowardStats: true,
      startTime: { $lte: end },
      endTime: { $gte: start },
    }).sort({ startTime: 1 });

    const totalFocusSessions = sessions.length;

    let totalDeepWorkMins = 0;
    for (const session of sessions) {
      totalDeepWorkMins += session.actualDuration || 0;
    }

    res.status(200).json({
      totalFocusSessions,
      totalDeepWorkMins,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

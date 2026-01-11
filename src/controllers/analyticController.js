import Session from '../models/Session.js';
import Task from '../models/Task.js';

export const getFocusConsistency = async (req, res) => {
  try {
    const userID = req.userID;
    const days = parseInt(req.params.days);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const results = await Session.aggregate([
      {
        $match: {
          userID,
          countsTowardStats: true,
          startTime: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$startTime',
              timezone: 'America/New_York',
            },
          },
          minutes: { $sum: `$actualDuration` },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Fill in 0's for dates with no activity
    const minutesByDate = new Map(results.map((r) => [r._id, r.minutes]));

    const response = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const key = date.toISOString().split('T')[0];
      response.push({ date: key, minutes: minutesByDate.get(key) || 0 });
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getFocusHours = async (req, res) => {
  try {
    const userID = req.userID;
    const days = parseInt(req.params.days);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const results = await Session.aggregate([
      {
        $match: {
          userID,
          countsTowardStats: true,
          startTime: { $gte: startDate },
        },
      },
      {
        $addFields: {
          hour: { $hour: { date: '$startTime', timezone: 'America/New_York' } },
        },
      },
      {
        $addFields: {
          hourBuckets: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [{ $gte: ['$hour', 6] }, { $lt: ['$hour', 9] }],
                  },
                  then: '6-9 AM',
                },
                {
                  case: {
                    $and: [{ $gte: ['$hour', 9] }, { $lt: ['$hour', 12] }],
                  },
                  then: '9-12 PM',
                },
                {
                  case: {
                    $and: [{ $gte: ['$hour', 12] }, { $lt: ['$hour', 15] }],
                  },
                  then: '12-3 PM',
                },
                {
                  case: {
                    $and: [{ $gte: ['$hour', 15] }, { $lt: ['$hour', 18] }],
                  },
                  then: '3-6 PM',
                },
                {
                  case: {
                    $and: [{ $gte: ['$hour', 18] }, { $lt: ['$hour', 21] }],
                  },
                  then: '6-9 PM',
                },
                {
                  case: {
                    $and: [{ $gte: ['$hour', 21] }, { $lt: ['$hour', 24] }],
                  },
                  then: '9 PM-12 AM',
                },
                {
                  case: {
                    $and: [{ $gte: ['$hour', 0] }, { $lt: ['$hour', 6] }],
                  },
                  then: '12-6 AM',
                },
              ],
              default: 'Other',
            },
          },
        },
      },
      {
        $group: {
          _id: { $toString: '$hourBuckets' },
          minutes: { $sum: '$actualDuration' },
        },
      },
    ]);

    const allHourBuckets = [
      '12-6 AM',
      '6-9 AM',
      '9-12 PM',
      '12-3 PM',
      '3-6 PM',
      '6-9 PM',
      '9 PM-12 AM',
    ];

    const minutesByHours = new Map(results.map((r) => [r._id, r.minutes]));

    // Fill in 0's for buckets with no activity
    const response = [];
    for (const bucket of allHourBuckets) {
      response.push({
        hourBucket: bucket,
        minutes: minutesByHours.get(bucket) || 0,
      });
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getSessionOutcomes = async (req, res) => {
  try {
    const userID = req.userID;
    const days = parseInt(req.params.days);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    // Completed -> completed === true
    // Ended Early -> completed === false AND countsTowardStats === true
    // Discarded -> countsTowardStats === false
    const results = await Session.aggregate([
      {
        $match: { userID, startTime: { $gte: startDate } },
      },
      {
        $addFields: {
          outcomes: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $eq: ['$completed', true] },
                      { $eq: ['$countsTowardStats', true] },
                    ],
                  },
                  then: 'Completed',
                },
                {
                  case: {
                    $and: [
                      { $eq: ['$completed', false] },
                      { $eq: ['$countsTowardStats', true] },
                    ],
                  },
                  then: 'Ended Early',
                },
                {
                  case: { $eq: ['$countsTowardStats', false] },
                  then: 'Discarded',
                },
              ],
              default: 'Discarded',
            },
          },
        },
      },
      {
        $group: {
          _id: '$outcomes',
          value: { $sum: 1 }, // count sessions
        },
      },
    ]);

    const allOutcomes = ['Completed', 'Ended Early', 'Discarded'];

    const countsOutcomes = new Map(results.map((r) => [r._id, r.value]));

    const response = allOutcomes.map((outcome) => ({
      name: outcome,
      value: countsOutcomes.get(outcome) || 0,
    }));

    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const userID = req.userID;

    // 1. Total sessions (all completed sessions that count toward stats)
    const totalSessions = await Session.countDocuments({
      userID,
      countsTowardStats: true,
    });

    // 2. Total focus time (sum of all actualDuration from sessions that count)
    const focusTimeResult = await Session.aggregate([
      {
        $match: {
          userID,
          countsTowardStats: true,
        },
      },
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: '$actualDuration' },
        },
      },
    ]);
    const totalFocusTime =
      focusTimeResult.length > 0 ? focusTimeResult[0].totalMinutes : 0;

    // 3. Tasks completed
    const tasksCompleted = await Task.countDocuments({
      userID,
      completed: true,
    });

    // 4. Current streak (consecutive days with at least one session)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStreak = 0;
    let checkDate = new Date(today);

    while (true) {
      const dayStart = new Date(checkDate);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);

      const sessionsOnDay = await Session.countDocuments({
        userID,
        countsTowardStats: true,
        startTime: { $gte: dayStart, $lte: dayEnd },
      });

      if (sessionsOnDay > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If today has no sessions, streak is 0
        // Otherwise, we've found the end of the streak
        if (currentStreak === 0 && checkDate.getTime() === today.getTime()) {
          break;
        } else if (checkDate.getTime() < today.getTime()) {
          break;
        } else {
          break;
        }
      }
    }

    res.status(200).json({
      totalSessions,
      totalFocusTime,
      tasksCompleted,
      currentStreak,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

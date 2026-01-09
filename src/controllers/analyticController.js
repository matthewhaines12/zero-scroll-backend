import Session from '../models/Session.js';

export const focusConsistency = async (req, res) => {
  try {
    const userID = req.userID;
    const days = parseInt(req.params.days);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0); // Start date at midnight x days ago

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
            },
          },
          minutes: { $sum: `$actualDuration` },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    console.log('results test:', results);

    // Fill in 0's for dates with no activity
    const minutesByDate = new Map(results.map((r) => [r._id, r.minutes]));

    const response = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const key = date.toISOString().slice(0, 10);
      response.push({ date: key, minutes: minutesByDate.get(key) || 0 });
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

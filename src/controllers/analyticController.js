import Session from '../models/Session.js';

export const getFocusConsistency = async (req, res) => {
  try {
    const userID = req.userID;
    const days = parseInt(req.params.days);

    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
    startDate.setUTCHours(0, 0, 0, 0); // Start date at UTC midnight x days ago

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
              timezone: 'UTC',
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
      date.setUTCDate(startDate.getUTCDate() + i);

      const key = date.toISOString().split('T')[0]; // YYYY-MM-DD in UTC
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
    startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
    startDate.setUTCHours(0, 0, 0, 0); // Start date at UTC midnight x days ago

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
          hour: { $hour: '$startTime' },
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

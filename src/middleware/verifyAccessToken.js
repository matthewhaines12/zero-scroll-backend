// Protect private routes - only accessible by authenticated users
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;

const verifyAccessToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: 'Access token missing' });

  const accessToken = authHeader.split(' ')[1];

  if (!accessToken)
    return res.status(401).json({ error: 'Access token missing' });

  let decoded;
  try {
    decoded = jwt.verify(accessToken, JWT_ACCESS_SECRET);
  } catch (err) {
    return res.status(403).json({ error: 'Invalid access token' });
  }

  try {
    const user = await User.findById(decoded.userID);

    if (!user) {
      return res.status(404).json({ error: "User doesn't exist" });
    }

    req.userID = user._id;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default verifyAccessToken;

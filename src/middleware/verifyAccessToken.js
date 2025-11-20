// Protect private routes - only accessible by authenticated users
const jwt = require("jsonwebtoken");

const JWT_ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;

const verifyAccessToken = (req, res, next) => {
  authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: "Access token missing" });

  const accessToken = authHeader.split(" ")[1];

  if (!accessToken)
    return res.status(401).json({ error: "Access token missing" });

  jwt.verify(accessToken, JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Inalid access token" });

    req.userID = decoded.userID;
    next();
  });
};

module.exports = verifyAccessToken;

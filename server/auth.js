const jwt = require("jsonwebtoken");
const { jwtSecret } = require("./config");

function createToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: "7d" });
}

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Token ausente." });
  }

  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Token invalido." });
  }
}

module.exports = {
  createToken,
  authRequired
};
